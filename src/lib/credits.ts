import prisma from '@/lib/prisma';

// Credit costs for each action
export const CREDIT_COSTS: Record<string, number> = {
    GENERATE_RESUME: 2,
    PARSE_RESUME: 1,
    ATS_SCORE: 1,
    COVER_LETTER: 2,
    REWRITE_BULLETS: 1,
    AI_SUGGEST: 0, // free
};

export interface CreditResult {
    success: boolean;
    remaining: number;
    error?: string;
}

/**
 * Deduct credits from a user's account and log the transaction.
 */
export async function deductCredits(
    userId: string,
    action: keyof typeof CREDIT_COSTS,
    description: string
): Promise<CreditResult> {
    const cost = CREDIT_COSTS[action];

    if (cost === 0) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        return { success: true, remaining: user?.credits ?? 0 };
    }

    // Atomic: check + deduct in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error('User not found');
        if (user.credits < cost) {
            return { success: false, remaining: user.credits, error: `Insufficient credits. Need ${cost}, have ${user.credits}.` };
        }

        const updated = await tx.user.update({
            where: { id: userId },
            data: { credits: { decrement: cost } },
        });

        await tx.transaction.create({
            data: {
                userId,
                amount: -cost,
                type: 'USAGE',
                description,
            },
        });

        return { success: true, remaining: updated.credits };
    });

    return result;
}

/**
 * Check if a user has enough credits for an action WITHOUT deducting.
 * Use this before expensive operations, then call deductCredits after success.
 */
export async function checkCredits(
    userId: string,
    action: keyof typeof CREDIT_COSTS
): Promise<{ allowed: boolean; balance: number; cost: number }> {
    const cost = CREDIT_COSTS[action];
    if (cost === 0) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        return { allowed: true, balance: user?.credits ?? 0, cost: 0 };
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { allowed: false, balance: 0, cost };
    return { allowed: user.credits >= cost, balance: user.credits, cost };
}

/**
 * Refund credits back to a user (e.g., if an operation failed after deduction).
 */
export async function refundCredits(
    userId: string,
    action: keyof typeof CREDIT_COSTS,
    reason: string
): Promise<CreditResult> {
    const cost = CREDIT_COSTS[action];
    if (cost === 0) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        return { success: true, remaining: user?.credits ?? 0 };
    }
    // Verify user exists first
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, remaining: 0, error: 'User not found' };

    const updated = await prisma.user.update({
        where: { id: userId },
        data: { credits: { increment: cost } },
    });
    await prisma.transaction.create({
        data: { userId, amount: cost, type: 'REFUND', description: `Refund: ${reason}` },
    });
    return { success: true, remaining: updated.credits };
}

/**
 * Add credits to a user's account (for purchases / bonuses).
 */
export async function addCredits(
    userId: string,
    amount: number,
    type: 'PURCHASE' | 'BONUS',
    description: string
): Promise<CreditResult> {
    // Safely check if user exists first to avoid P2025 update error
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, credits: true }
    });

    if (!user) {
        return {
            success: false,
            remaining: 0,
            error: 'User record not found in database. This might happen if your account was recently deleted or database was reset. Please sign out and sign in again.'
        };
    }

    const updated = await prisma.user.update({
        where: { id: userId },
        data: { credits: { increment: amount } },
    });

    await prisma.transaction.create({
        data: {
            userId,
            amount,
            type,
            description,
        },
    });

    return { success: true, remaining: updated.credits };
}

/**
 * Get a user's credit balance and recent transactions.
 */
export async function getUserCredits(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { credits: true },
    });

    const transactions = await prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
    });

    return {
        balance: user?.credits ?? 0,
        transactions,
    };
}
