import passport from "passport";
import { OIDCStrategy } from "passport-azure-ad";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.MICROSOFT_CLIENT_ID || !process.env.MICROSOFT_CLIENT_SECRET || !process.env.MICROSOFT_TENANT_ID) {
  throw new Error("Microsoft Azure AD environment variables not provided");
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

async function upsertUser(profile: any) {
  await storage.upsertUser({
    id: profile.oid || profile.sub,
    email: profile.upn || profile.email,
    firstName: profile.given_name,
    lastName: profile.family_name,
    profileImageUrl: null,
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure Microsoft Azure AD OIDC Strategy
  const strategy = new OIDCStrategy(
    {
      identityMetadata: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}/v2.0/.well-known/openid_configuration`,
      clientID: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      responseType: "code",
      responseMode: "form_post",
      redirectUrl: `${process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`}/api/callback`,
      allowHttpForRedirectUrl: process.env.NODE_ENV === 'development',
      validateIssuer: true,
      passReqToCallback: false,
      scope: ["openid", "profile", "email"],
      loggingLevel: "error",
      nonceLifetime: null,
      nonceMaxAmount: 5,
      useCookieInsteadOfSession: false,
      cookieEncryptionKeys: [
        { key: "12345678901234567890123456789012", iv: "123456789012" },
        { key: "abcdefghijklmnopqrstuvwxyz123456", iv: "abcdefghijkl" }
      ],
    },
    async (iss: string, sub: string, profile: any, accessToken: string, refreshToken: string, done: any) => {
      try {
        // Verify domain restriction
        const email = profile.upn || profile.email;
        if (!email || !email.endsWith('@omneseducation.com')) {
          return done(new Error('Access restricted to omneseducation.com domain'), null);
        }

        await upsertUser(profile);
        
        const user = {
          profile,
          accessToken,
          refreshToken,
          expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        };
        
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  );

  passport.use(strategy);

  passport.serializeUser((user: any, done) => {
    done(null, user);
  });

  passport.deserializeUser((user: any, done) => {
    done(null, user);
  });

  // Authentication routes
  app.get("/api/login", passport.authenticate("azuread-openidconnect", {
    prompt: "select_account",
  }));

  app.post("/api/callback", passport.authenticate("azuread-openidconnect", {
    successRedirect: "/",
    failureRedirect: "/api/login",
  }));

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      const logoutUrl = `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURIComponent(`${req.protocol}://${req.hostname}`)}`;
      res.redirect(logoutUrl);
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  // For Microsoft Azure AD, token refresh is handled by the strategy
  // If token is expired, redirect to login
  res.status(401).json({ message: "Unauthorized" });
  return;
};
