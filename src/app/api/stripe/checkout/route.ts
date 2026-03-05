import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-02-24.acacia' as any,
});

// Mapping of packages to Stripe prices or raw amounts
const PACKAGES: Record<string, { amount: number; tokens: number; name: string }> = {
    starter: { amount: 500, tokens: 50, name: 'Starter Token Bundle' }, // $5.00
    professional: { amount: 1500, tokens: 200, name: 'Professional Token Bundle' }, // $15.00
    elite: { amount: 3000, tokens: 500, name: 'Elite Token Bundle' }, // $30.00
};

export async function POST(req: Request) {
    try {
        const session: any = await getServerSession(authOptions);
        if (!session?.user?.id || !session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { packageId } = await req.json();
        const pkg = PACKAGES[packageId];

        if (!pkg) {
            return NextResponse.json({ error: 'Invalid package selected' }, { status: 400 });
        }

        // In a real app, you might want to create or retrieve a Stripe Customer 
        // based on session.user.email to keep their billing history consolidated.

        // Create Checkout Session
        const checkoutSession = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            customer_email: session.user.email,
            metadata: {
                userId: session.user.id,
                tokensToAdd: pkg.tokens.toString(),
            },
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: pkg.name,
                            description: `Adds ${pkg.tokens} AI Tokens to your account.`,
                        },
                        unit_amount: pkg.amount,
                    },
                    quantity: 1,
                },
            ],
            success_url: `${process.env.NEXTAUTH_URL}/profile?payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXTAUTH_URL}/profile?payment=cancelled`,
        });

        return NextResponse.json({ url: checkoutSession.url });
    } catch (error: any) {
        console.error('Stripe Checkout Error:', error);
        return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
    }
}
