import type { AppProps } from 'next/app';

import { ChakraProvider } from '@chakra-ui/react';

import Layout from '../components/layout';

import { theme } from '../util/chakra';

function MyApp({ Component, pageProps }: AppProps) {
    return (
        <ChakraProvider theme={theme}>
            <Layout title={pageProps.title}>
                <Component {...pageProps} />
            </Layout>
        </ChakraProvider>
    );
}

export default MyApp;
