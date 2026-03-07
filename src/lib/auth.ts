import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import LinkedInProvider from 'next-auth/providers/linkedin';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

const providers: NextAuthOptions['providers'] = [
    CredentialsProvider({
        name: 'Email',
        credentials: {
            email: { label: 'Email', type: 'email' },
            password: { label: 'Password', type: 'password' },
        },
        async authorize(credentials) {
            if (!credentials?.email || !credentials?.password) return null;

            const user = await prisma.user.findUnique({
                where: { email: credentials.email },
            });

            if (!user || !user.password) return null;

            const valid = await bcrypt.compare(credentials.password, user.password);
            if (!valid) return null;

            return { id: user.id, email: user.email, name: user.name, credits: user.credits };
        },
    }),
];

// Add Google OAuth if configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
        })
    );
}

// Add GitHub OAuth if configured
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    providers.push(
        GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
        })
    );
}

// Add LinkedIn OAuth if configured
if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
    providers.push(
        LinkedInProvider({
            clientId: process.env.LINKEDIN_CLIENT_ID,
            clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
            issuer: 'https://www.linkedin.com/oauth',
            jwks_endpoint: 'https://www.linkedin.com/oauth/openid/jwks',
            profile(profile) {
                return {
                    id: profile.sub,
                    name: profile.name,
                    email: profile.email,
                    image: profile.picture,
                };
            },
        })
    );
}

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma) as Exclude<NextAuthOptions['adapter'], undefined>,
    session: { strategy: 'jwt' },
    pages: { signIn: '/auth/signin' },
    providers,
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.credits = (user as { credits?: number }).credits;
            }
            if (trigger === 'update' && session) {
                // NextAuth update() hook passes the session from the client if provided, however the better and safer way is to let the session callback fetch from DB because we just mutated the DB directly in the API. We can just return token here and let session() fetch latest DB values.
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as { id?: string; credits?: number }).id = token.id as string;

                // Fetch latest user details from DB along with their linked OAuth accounts
                const dbUser = await prisma.user.findUnique({
                    where: { id: token.id as string },
                    include: { accounts: true }
                });

                if (dbUser) {
                    (session.user as any).credits = dbUser.credits ?? 0;
                    (session.user as any).name = dbUser.name;
                    (session.user as any).image = dbUser.image;
                    (session.user as any).phone = dbUser.phone;
                    (session.user as any).address = dbUser.address;
                    // Pass down an array of connected provider IDs (e.g. ['google', 'github', 'linkedin'])
                    (session.user as any).connectedProviders = dbUser.accounts.map(acc => acc.provider);
                }
            }
            return session;
        },
    },
};
