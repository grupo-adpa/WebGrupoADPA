module.exports = {
  ci: {
    collect: {
      url: ["http://127.0.0.1:4173/"],
      startServerCommand: "node scripts/serve-dist.mjs",
      startServerReadyPattern: "READY",
      numberOfRuns: 3,
      settings: { chromeFlags: "--headless --no-sandbox" },
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.9 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["error", { minScore: 0.9 }],
        "categories:seo": ["error", { minScore: 0.9 }],
      },
    },
    upload: { target: "filesystem", outputDir: ".lighthouseci/reports" },
  },
};
