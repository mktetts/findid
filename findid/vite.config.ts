import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import * as path from "path";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vitejs.dev/config/
export default defineConfig({
    base: "./",
    plugins: [
        react(),
        // basicSsl(),
        nodePolyfills({
            globals: {
                Buffer: true,
                global: true,
                process: true,
            },
            protocolImports: true,
        }),
    ],
    server: {
        open: true,
    },
    resolve: {
        alias: [{ find: "@", replacement: path.resolve(__dirname, "src") }],
    },
    build: {
        commonjsOptions: { transformMixedEsModules: true },
    },
    assetsInclude: ['**/*.wasm']
});
