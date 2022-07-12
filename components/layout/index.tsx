import { Box, Container } from '@chakra-ui/react';

import Head from './head';
import Header, { navbarHeight } from './header';
import Footer from './footer';

type Props = {
    title?: string;
    children: React.ReactNode;
};

const Layout = ({ title, children }: Props) => (
    <>
        <Head title={title} />
        <Box bg="neutral.50" minHeight="100vh" pt={navbarHeight + 2} position="relative">
            <Header />
            <Container maxW="container.sm" pb={16} px={[2, 3, 4]}>
                <Box as="main">
                    <Box>{children}</Box>
                </Box>
            </Container>
            <Footer />
        </Box>
    </>
);

export default Layout;
