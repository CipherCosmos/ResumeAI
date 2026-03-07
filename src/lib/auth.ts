import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import LinkedInProvider from 'next-auth/providers/linkedin';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { decode } from 'next-auth/jwt';

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
        async signIn({ user, account, profile }) {
            // NextAuth's native "Account Linking" drops the login and throws `OAuthAccountNotLinked`
            // if you try to sign in with an OAuth account that has a DIFFERENT email than the active session,
            // or if the email exists but isn't explicitly linked yet (especially in JWT mode).

            if (account && account.provider !== 'credentials') {
                try {
                    // Try to extract the active session token to see if someone is currently logged in!
                    const cookieStore = await cookies();
                    // NextAuth uses different cookie prefixes in dev (http) vs prod (https)
                    const sessionToken = cookieStore.get('next-auth.session-token')?.value ||
                        cookieStore.get('__Secure-next-auth.session-token')?.value;

                    let activeUserId = null;

                    if (sessionToken) {
                        // Decode the JWT to find who is currently logged into the app
                        const decoded = await decode({
                            token: sessionToken,
                            secret: process.env.NEXTAUTH_SECRET as string,
                        });
                        if (decoded && decoded.id) {
                            activeUserId = decoded.id as string;
                        }
                    }

                    // If a user is actively logged in, bind the OAuth account to THEIR identity
                    // regardless of what email the OAuth provider sent us!
                    if (activeUserId) {
                        const existingUser = await prisma.user.findUnique({
                            where: { id: activeUserId },
                            include: { accounts: true },
                        });

                        if (existingUser) {
                            const isLinked = existingUser.accounts.some((acc) => acc.provider === account.provider);

                            if (!isLinked) {
                                await prisma.account.create({
                                    data: {
                                        userId: existingUser.id,
                                        type: account.type,
                                        provider: account.provider,
                                        providerAccountId: account.providerAccountId,
                                        access_token: account.access_token,
                                        refresh_token: account.refresh_token,
                                        expires_at: account.expires_at,
                                        token_type: account.token_type,
                                        scope: account.scope,
                                        id_token: account.id_token,
                                        session_state: account.session_state,
                                    },
                                });
                            }
                            return true;
                        }
                    } else if (user.email) {
                        // Fallback: If no one is actively logged in (e.g. they are just logging in normally)
                        // but an account with this email already exists, link it silently.
                        const existingUserByEmail = await prisma.user.findUnique({
                            where: { email: user.email },
                            include: { accounts: true },
                        });

                        if (existingUserByEmail) {
                            const isLinked = existingUserByEmail.accounts.some((acc) => acc.provider === account.provider);

                            if (!isLinked) {
                                await prisma.account.create({
                                    data: {
                                        userId: existingUserByEmail.id,
                                        type: account.type,
                                        provider: account.provider,
                                        providerAccountId: account.providerAccountId,
                                        access_token: account.access_token,
                                        refresh_token: account.refresh_token,
                                        expires_at: account.expires_at,
                                        token_type: account.token_type,
                                        scope: account.scope,
                                        id_token: account.id_token,
                                        session_state: account.session_state,
                                    },
                                });
                            }
                            return true;
                        }
                    }
                } catch (error) {
                    console.error('Error during automatic account linking', error);
                }
            }
            return true;
        },
        async jwt({ token, user, trigger, session, account }) {
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
                    (session.user as any).phone = (dbUser as any).phone;
                    (session.user as any).address = (dbUser as any).address;
                    // Pass down an array of connected provider IDs (e.g. ['google', 'github', 'linkedin'])
                    (session.user as any).connectedProviders = dbUser.accounts.map(acc => acc.provider);
                }
            }
            return session;
        },
    },
};
