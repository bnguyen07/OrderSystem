import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      name: "Database Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "enterprise@ordersystem.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          // Point to localhost during Next.js SSG build, but the Docker K8s networking in Azure uses 'ordersystem-api'
          const apiHost = process.env.NODE_ENV === "production" ? "http://ordersystem-api:80" : "http://localhost:5246";
          
          const res = await fetch(`${apiHost}/api/Identity/login`, {
            method: 'POST',
            body: JSON.stringify({ email: credentials.email, password: credentials.password }),
            headers: { "Content-Type": "application/json" }
          });
          
          if (res.ok) {
             const user = await res.json();
             return user; // Passes { id, email, name, omniToken } directly into NextAuth jwt callback
          }
        } catch (e) {
          console.error("OmniAuth Internal Failure:", e);
        }
        return null;
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async jwt({ token, account, user }) {
      // 1. Google Integration
      if (account?.provider === 'google') {
        token.idToken = account.id_token;
      }
      
      // 2. OmniAuth Datastore Integration
      if (user && (user as any).omniToken) {
        token.idToken = (user as any).omniToken; // The physical C# signed JWT organically mapped!
      }

      return token;
    },
    async session({ session, token }) {
      // Unify the tokens into Next.js React Frontend payload
      (session as any).idToken = token.idToken;
      return session;
    },
  },
});

export { handler as GET, handler as POST };
