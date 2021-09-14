# FAQ (Frequently Asked Questions)

## How can I get support?

Please ask questions in the #developer-support channel on the Solana Discord: https://discord.com/invite/pquxPsq

After reading this FAQ, if you've found a bug or you'd like to request a feature, please [open an issue](https://github.com/solana-labs/wallet-adapter/issues/new).

## Can I use this with ___?

### React
Yes, see the [react-ui-starter](https://github.com/solana-labs/wallet-adapter/tree/master/packages/starter/react-ui-starter) package

### Next.js (with React)
Yes, see the [nextjs-starter](https://github.com/solana-labs/wallet-adapter/tree/master/packages/starter/nextjs-starter) package.

### Material UI (with React)
Yes, see the [material-ui-starter](https://github.com/solana-labs/wallet-adapter/tree/master/packages/starter/material-ui-starter) package.

### Ant Design (with React)
Yes, see the [ant-design](https://github.com/solana-labs/wallet-adapter/tree/master/packages/core/ant-design) package.

### Angular / RxJS
Yes, see the [angular](https://github.com/solana-labs/wallet-adapter/tree/master/packages/core/angular) package.

### Vue / Vuex
Not yet, see [issue #67](https://github.com/solana-labs/wallet-adapter/issues/67). Please contribute if you want to add Vue support!

### Webpack / Babel / Rollup / Vite / Snowpack / esbuild
Yes, but you may need to provide custom build configuration.
Most of the packages are built using the TypeScript compiler, which outputs modular ES6 with `import`/`export` statements.

If you're using Create React App, craco, or one of the React-based starter projects using them, this should be handled automatically.

If you're using Next.js, this requires configuration, which is provided in the [nextjs-starter](https://github.com/solana-labs/wallet-adapter/tree/master/packages/starter/nextjs-starter) package.

If you're using something else, you may have to configure your build tool to transpile the packages similarly to how it's done in the Next.js config.
Please open an issue or pull request to document your solution!

## What does this error mean?

### `Failed to compile. [...] Module not found: Can't resolve [...]`

This can happen if you're cloning the project and [building it from the source](https://github.com/solana-labs/wallet-adapter/blob/master/README.md#build-from-source) and you missed a step.

If this doesn't fix the problem, please [open an issue](https://github.com/solana-labs/wallet-adapter/issues/new).

### `[...] is undefined` / `Uncaught TypeError: Cannot destructure property` / `Uncaught (in promise) WalletNotConnectedError`

This can happen if you don't wrap your dApp with the `WalletContext` and `ConnectionContext` provided by the [react](https://github.com/solana-labs/wallet-adapter/tree/master/packages/core/react) package. See [issue #62](https://github.com/solana-labs/wallet-adapter/issues/62#issuecomment-916421795) and [issue #73](https://github.com/solana-labs/wallet-adapter/issues/73#issuecomment-919237687).

This shouldn't happen if you're using one of the starter projects, since they set up the contexts for you.

### `[...] is not a function`

This can happen if you try to use `signTransaction`, `signAllTransactions`, or `signMessage` without checking if they are defined first.

`sendTransaction` is the primary method that all wallets support, and it signs transactions.
The other methods are optional APIs, so you have to feature-detect them before using them.

Please see [issue #72](https://github.com/solana-labs/wallet-adapter/issues/72#issuecomment-919232595).

### Torus wallet doesn't connect / `registering module Get a client ID @ https://developer.tor.us`

This can happen if you're using one of the starter projects and you didn't configure Torus for your dApp.

Go to https://developer.tor.us to sign up for your own unique client ID. Then use this ID in your configuration:
```tsx
    const wallets = useMemo(() => [
        // ...
        getTorusWallet({
            options: { clientId: '<YOUR CLIENT ID>' },
        }),
        // ...
    ], [network]);
```
