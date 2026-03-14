import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { addCredits } from '@/lib/credits';

export async function POST(req: Request) {
    try {
        const session: any = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, tokens } = await req.json();

        const key_secret = process.env.RAZORPAY_KEY_SECRET;
        if (!key_secret) {
            return NextResponse.json({ error: 'Razorpay secret missing' }, { status: 500 });
        }

        // Verify Signature
        const generated_signature = crypto
            .createHmac('sha256', key_secret)
            .update(razorpay_order_id + '|' + razorpay_payment_id)
            .digest('hex');

        if (generated_signature !== razorpay_signature) {
            return NextResponse.json({ error: 'Invalid Payment Signature' }, { status: 400 });
        }

        // Payment is legit! Let's add the requested credits to the user.
        // `tokens` specifies how many tokens were bought depending on the package they picked on frontend.
        const parsedTokens = parseInt(tokens, 10);
        if (isNaN(parsedTokens) || parsedTokens <= 0) {
            return NextResponse.json({ error: 'Invalid token amount' }, { status: 400 });
        }

        const result = await addCredits(
            session.user.id,
            parsedTokens,
            'PURCHASE',
            `Purchased AI tokens via Razorpay (Order: ${razorpay_order_id})`
        );

        if (!result.success) {
            console.error('Credit addition failed:', result.error);
            return NextResponse.json({ error: result.error || 'Failed to add credits' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Razorpay Verification Error:', error);
        return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 });
    }
}
