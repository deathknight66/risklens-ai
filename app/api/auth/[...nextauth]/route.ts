import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import db from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "RiskLens Auth",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@risklens.local" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(credentials.email) as any;
        
        if (!user) {
          return null;
        }

        const isMatch = bcrypt.compareSync(credentials.password, user.password_hash);
        
        // Log the authentication attempt
        const ip = req?.headers?.['x-forwarded-for'] || 'unknown';
        const userAgent = req?.headers?.['user-agent'] || 'unknown';
        db.prepare('INSERT INTO auth_logs (id, user_id, ip, user_agent, login_at, status) VALUES (?, ?, ?, ?, ?, ?)').run(
          `log_${crypto.randomBytes(8).toString('hex')}`,
          user.id,
          ip,
          userAgent,
          new Date().toISOString(),
          isMatch ? 'Success' : 'Failed'
        );

        if (isMatch) {
          return { id: user.id, email: user.email, name: user.email, role: user.role };
        }
        
        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.role = token.role;
        session.user.id = token.id;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt" as const,
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET || "risklens_secret_key_for_development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
