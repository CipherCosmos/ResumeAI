import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-02-24.acacia' as any,
});

// Next.js config to disable body parsing for the webhook so Stripe can verify the raw signature
export const config = {
    api: {
        bodyParser: false,
    },
};

export async function POST(req: Request) {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
        return NextResponse.json({ error: 'Missing stripe-signature or webhook secret' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
        console.error('Webhook signature verification failed.', err.message);
        return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;

        // Retrieve metadata exactly as passed by the checkout session creation
        const userId = session.metadata?.userId;
        const tokensToAdd = parseInt(session.metadata?.tokensToAdd || '0', 10);

        if (userId && tokensToAdd > 0) {
            try {
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        credits: {
                            increment: tokensToAdd,
                        },
                    },
                });

                // Optionally create a Transaction log in the DB here

                console.log(`Successfully added ${tokensToAdd} tokens to user ${userId}`);
            } catch (error) {
                console.error('Failed to update user credits after successful payment:', error);
                // We still return 200 to Stripe so it doesn't retry, but log the error
            }
        }
    }

    return NextResponse.json({ received: true });
}
