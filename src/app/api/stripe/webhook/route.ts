import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

export async function POST(req: Request) {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET || !process.env.STRIPE_SECRET_KEY) {
        return NextResponse.json({ error: 'Missing stripe-signature or webhook secret or secret key' }, { status: 400 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2025-02-24.acacia' as any,
    });

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
                const { addCredits } = await import('@/lib/credits');
                await addCredits(
                    userId,
                    tokensToAdd,
                    'PURCHASE',
                    `Stripe Purchase: ${tokensToAdd} Credits (Session: ${session.id.slice(-8)})`
                );
                console.log(`Successfully added ${tokensToAdd} tokens to user ${userId} via addCredits helper`);
            } catch (error) {
                console.error('Failed to update user credits after successful payment:', error);
            }
        }
    }

    return NextResponse.json({ received: true });
}
