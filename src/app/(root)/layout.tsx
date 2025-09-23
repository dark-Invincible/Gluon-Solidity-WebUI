import { Toaster } from '@/components/ui/toaster';
import Navbar from '@/components/navbar';
import Web3ModalProvider from '@/wagmi/provider/web3-modal';
import { headers } from 'next/headers'
import { cookieToInitialState } from 'wagmi'
import { config } from '@/wagmi/config'

export default async function ApplicationLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {

    // const initialState = cookieToInitialState(config, headers().get('cookie'));

    return (
        <div className="h-screen">
            <Web3ModalProvider>
            <Navbar />
            <main className="h-full pt-[70px]">{children}</main>
            <Toaster />
            </Web3ModalProvider>
        </div>
    );
}
