import { Connection, Message, PublicKey, Transaction } from '@solana/web3.js';
import {
    MessageSignerWalletAdapterProps,
    SignerWalletAdapterProps,
    WalletAdapterProps,
} from '@solana/wallet-adapter-base';
import { Wallet, WalletName } from '@solana/wallet-adapter-wallets';
import { ref, computed, Ref } from '@vue/reactivity';
import { watch, watchEffect } from '@vue/runtime-core'; // TODO: Throws errors when compiling...
import { useLocalStorage } from './useLocalStorage';

type Adapter = ReturnType<Wallet['adapter']>;
type WalletDictionary = { [key: string]: Wallet };

export interface WalletStore extends WalletAdapterProps {
    wallets: Wallet[];
    autoConnect: boolean;

    wallet: Wallet | null;
    adapter: Adapter | null;
    disconnecting: boolean;

    select(walletName: WalletName): void;
    signTransaction: SignerWalletAdapterProps['signTransaction'] | undefined;
    signAllTransactions: SignerWalletAdapterProps['signAllTransactions'] | undefined;
    signMessage: MessageSignerWalletAdapterProps['signMessage'] | undefined;
}

let walletStore: object = {} as object;

export const useWallet = (): object => walletStore;

export const initWallet = (wallets: Wallet[], autoConnect = false): void => {
    const walletProvider: Ref<string | null> = useLocalStorage<string>('solana-wallet-provider');
    const wallet: Ref<Wallet | null> = ref<Wallet | null>(null);
    const adapter: Ref<Adapter | null> = ref<Adapter | null>(null);
    const publicKey: Ref<PublicKey | null> = ref<PublicKey | null>(null);
    const ready: Ref<boolean | null> = ref<boolean | null>(false);
    const connected: Ref<boolean | null> = ref<boolean | null>(false);
    const connecting: Ref<boolean | null> = ref<boolean | null>(false);
    const disconnecting: Ref<boolean | null> = ref<boolean | null>(false);

    const walletsByProvider: Ref<WalletDictionary> = computed<WalletDictionary>(() => {
        return wallets.reduce((walletsByProvider, wallet) => {
            walletsByProvider[wallet.name] = wallet
            return walletsByProvider
        }, {} as WalletDictionary)
    })

    // Update the wallet and adapter based on the wallet provider.
    watch(walletProvider, (): void => {
        wallet.value = walletsByProvider.value?.[walletProvider.value as string]
        adapter.value = wallet.value?.adapter()
        if (adapter.value) {
            ready.value = adapter.value.ready
            publicKey.value = adapter.value.publicKey
            connected.value = adapter.value.connected
        } else {
            ready.value = false
            publicKey.value = null
            connected.value = false
        }
    }, { immediate:true })

    // If autoConnect is enabled, try to connect when the adapter changes and is ready.
    watchEffect(async (): Promise<void> => {
        if (! autoConnect || ! adapter.value || ! ready.value || connected.value || connecting.value) return
        try {
            connecting.value = true
            await adapter.value.connect()
        } catch (error) {
            walletProvider.value = null
        } finally {
            connecting.value = false
        }
    })

    // Select a wallet by name.
    const select = async (newWalletProvider: Wallet): Promise<void> => {
        if (walletProvider.value === newWalletProvider) return
        if (adapter.value) await adapter.value.disconnect()
        walletProvider.value = newWalletProvider
    }

    // Handle the adapter events.
    const onReady = () => ready.value = true
    const onError = (error: Error) => console.log(error)
    const onDisconnect = () => {}
    const onConnect = () => {
        if (! adapter.value) return
        ready.value = adapter.value.ready
        publicKey.value = adapter.value.publicKey
        connected.value = adapter.value.connected
    }
    watchEffect(onInvalidate => {
        if (! adapter.value) return
        adapter.value.on('ready', onReady)
        adapter.value.on('connect', onConnect)
        adapter.value.on('disconnect', onDisconnect)
        adapter.value.on('error', onError)
        onInvalidate(() => {
            if (! adapter.value) return
            adapter.value.off('ready', onReady)
            adapter.value.off('connect', onConnect)
            adapter.value.off('disconnect', onDisconnect)
            adapter.value.off('error', onError)
        })
    })

    // Helper method to create an error whilst using the onError callback.
    const newError = (message: string): Error => {
        const error = new Error(message)
        onError(error)
        return error
    }

    // Connect the adapter to the wallet.
    const connect = async (): Promise<void> => {
        if (connected.value || connecting.value || disconnecting.value) return
        if (! wallet.value || ! adapter.value) throw newError('Wallet not selected')

        if (! ready.value) {
            walletProvider.value = null
            window.open(wallet.value.url, '_blank')
            throw newError('Wallet not ready')
        }

        try {
            connecting.value = true
            await adapter.value.connect()
        } catch (error) {
            walletProvider.value = null
            onError(error as Error)
            throw error
        } finally {
            connecting.value = false
        }
    }

    // Disconnect the adapter from the wallet.
    const disconnect = async () => {
        if (disconnecting.value) return
        if (! adapter.value) return walletProvider.value = null

        try {
            disconnecting.value = true
            await adapter.value.disconnect()
        } finally {
            walletProvider.value = null
            disconnecting.value = false
        }
    }

    // Send a transaction using the provided connection.
    const sendTransaction = async (transaction: Transaction, connection: Connection, options = {}) => {
        if (! adapter.value) throw newError('Wallet not selected')
        if (! connected.value) throw newError('Wallet not connected')
        return await adapter.value.sendTransaction(transaction, connection, options)
    }

    // Sign a transaction if the wallet supports it.
    const signTransaction = async (transaction: Transaction) => {
        if (! adapter?.value?.signTransaction) return
        if (! connected.value) throw newError('Wallet not connected')
        return await adapter.value.signTransaction(transaction)
    }

    // Sign multiple transactions if the wallet supports it
    const signAllTransactions = async (transactions: Transaction[]) => {
        if (! adapter?.value?.signAllTransactions) return
        if (! connected.value) throw newError('Wallet not connected')
        return await adapter.value.signAllTransactions(transactions)
    }

    // Sign an arbitrary message if the wallet supports it.
    const signMessage = async (message: Message) => {
        if (! adapter?.value?.signMessage) return
        if (! connected.value) throw newError('Wallet not connected')
        return await adapter.value.signMessage(message)
    }

    walletStore = {
        // Data
        walletProvider,
        walletsByProvider,
        wallet,
        adapter,
        publicKey,
        ready,
        connected,
        connecting,
        disconnecting,

        // Methods
        select,
        connect,
        disconnect,
        sendTransaction,
        signTransaction,
        signAllTransactions,
        signMessage,
    }
}
