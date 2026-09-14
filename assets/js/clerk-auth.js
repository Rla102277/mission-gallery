(function () {
  "use strict";

  var clerkPromise;
  var clerkScriptPromise;
  var appearance = {
    variables: {
      colorPrimary: "#b5922a",
      colorForeground: "#0d0d0d",
      colorMutedForeground: "#625d55",
      colorDanger: "#9f2f2f",
      colorBackground: "#faf7f0",
      colorInput: "#ffffff",
      colorInputForeground: "#0d0d0d",
      colorNeutral: "#d5cfc3",
      fontFamily: "Georgia, 'Times New Roman', serif",
      borderRadius: "2px",
    },
    elements: {
      rootBox: { width: "100%" },
      cardBox: {
        width: "440px",
        maxWidth: "100%",
        background: "#faf7f0",
        border: "1px solid rgba(13,13,13,.15)",
        boxShadow: "none",
      },
      card: { boxShadow: "none", background: "transparent" },
      headerTitle: { color: "#0d0d0d", fontFamily: "Georgia, serif" },
      headerSubtitle: { color: "#625d55" },
      formFieldLabel: { color: "#0d0d0d" },
      formButtonPrimary: { background: "#0d0d0d", color: "#f5f0e8" },
      footerActionLink: { color: "#8a6d17" },
      footerActionText: { color: "#625d55" },
      dividerText: { color: "#625d55" },
      socialButtonsBlockButtonText: { color: "#0d0d0d" },
    },
  };

  async function getClerk() {
    if (clerkPromise) return clerkPromise;
    clerkPromise = (async function () {
      var response = await fetch("/api/auth/config", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Could not load authentication");
      var config = await response.json();
      if (!config.publishableKey) {
        throw new Error("Authentication is not configured");
      }

      if (!window.Clerk) {
        clerkScriptPromise = clerkScriptPromise || new Promise(function (resolve, reject) {
          var script = document.createElement("script");
          script.src = "/assets/vendor/clerk/clerk.browser.js";
          script.async = true;
          script.crossOrigin = "anonymous";
          script.setAttribute("data-clerk-publishable-key", config.publishableKey);
          if (config.proxyUrl) {
            script.setAttribute("data-clerk-proxy-url", config.proxyUrl);
          }
          script.onload = resolve;
          script.onerror = function () {
            reject(new Error("Could not load Clerk browser components"));
          };
          document.head.appendChild(script);
        });
        await clerkScriptPromise;
      }

      var clerk = window.Clerk;
      if (!clerk) throw new Error("Clerk browser components did not initialize");
      await clerk.load({
        appearance: appearance,
        signInUrl: "/sign-in",
        signUpUrl: "/sign-up",
        afterSignInUrl: "/admin/",
        afterSignUpUrl: "/admin/",
        localization: {
          signIn: {
            start: {
              title: "Welcome back",
              subtitle: "Sign in to manage The Infinite Arch",
            },
          },
          signUp: {
            start: {
              title: "Create your account",
              subtitle: "Set up access to The Infinite Arch",
            },
          },
        },
      });
      return clerk;
    })();
    return clerkPromise;
  }

  async function mount(mode, target) {
    var clerk = await getClerk();
    if (clerk.user) {
      window.location.replace("/admin/");
      return;
    }
    var common = {
      routing: "path",
      path: mode === "sign-in" ? "/sign-in" : "/sign-up",
      forceRedirectUrl: "/admin/",
      appearance: appearance,
    };
    if (mode === "sign-in") {
      clerk.mountSignIn(target, Object.assign(common, { signUpUrl: "/sign-up" }));
    } else {
      clerk.mountSignUp(target, Object.assign(common, { signInUrl: "/sign-in" }));
    }
  }

  window.TIAClerk = {
    ready: getClerk,
    mountSignIn: function (target) {
      return mount("sign-in", target);
    },
    mountSignUp: function (target) {
      return mount("sign-up", target);
    },
    signOut: async function () {
      var clerk = await getClerk();
      await clerk.signOut();
      window.location.replace("/");
    },
  };
})();