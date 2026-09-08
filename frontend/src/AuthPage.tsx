import { useState } from "react";
import { SignIn, SignUp } from "@clerk/clerk-react";
import { ChefHatIcon, BowlIcon, LeafIcon, WhiskIcon } from "./icons";

const clerkAppearance = {
  variables: {
    colorPrimary: "#c1542c",
    colorText: "#2f231a",
    colorTextSecondary: "#7a6b58",
    colorBackground: "transparent",
    colorInputBackground: "#ffffff",
    colorInputText: "#2f231a",
    borderRadius: "8px",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  elements: {
    rootBox: { width: "100%" },
    card: {
      boxShadow: "none",
      border: "none",
      padding: 0,
      width: "100%",
      background: "transparent",
    },
    header: { display: "none" },
    footer: { background: "transparent" },
    footerAction: { textAlign: "center" as const },
    socialButtonsBlockButton: {
      border: "1px solid #e7dbc9",
      borderRadius: "8px",
    },
    formButtonPrimary: {
      backgroundColor: "#c1542c",
      fontSize: "0.92rem",
      textTransform: "none" as const,
      "&:hover": { backgroundColor: "#a5431f" },
    },
    formFieldInput: {
      borderRadius: "8px",
      borderColor: "#e7dbc9",
    },
    dividerLine: { background: "#e7dbc9" },
    identityPreviewEditButton: { color: "#c1542c" },
  },
};

export function AuthPage() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");

  return (
    <div className="auth-shell">
      <div className="auth-visual">
        <div className="auth-visual-content">
          <div className="auth-visual-brand">
            <ChefHatIcon width={26} height={26} />
            Kitchen Book
          </div>
        </div>
        <div className="auth-visual-quote">
          Every good meal starts with a recipe worth keeping.
          <span>Save your family favorites, organize them into albums, and never lose a recipe again.</span>
        </div>
        <div className="auth-visual-icons">
          <BowlIcon width={28} height={28} />
          <WhiskIcon width={28} height={28} />
          <LeafIcon width={28} height={28} />
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-panel-inner">
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${mode === "sign-in" ? "active" : ""}`}
              onClick={() => setMode("sign-in")}
            >
              Sign in
            </button>
            <button
              type="button"
              className={`auth-tab ${mode === "sign-up" ? "active" : ""}`}
              onClick={() => setMode("sign-up")}
            >
              Create account
            </button>
          </div>

          <h1 className="auth-heading">{mode === "sign-in" ? "Welcome back" : "Start your recipe box"}</h1>
          <p className="auth-sub">
            {mode === "sign-in"
              ? "Sign in to get back to your recipes."
              : "It's free — create an account to start saving recipes."}
          </p>

          {mode === "sign-in" ? (
            <SignIn
              routing="virtual"
              signUpUrl="#"
              appearance={clerkAppearance}
              fallbackRedirectUrl="/"
            />
          ) : (
            <SignUp
              routing="virtual"
              signInUrl="#"
              appearance={clerkAppearance}
              fallbackRedirectUrl="/"
            />
          )}
        </div>
      </div>
    </div>
  );
}
