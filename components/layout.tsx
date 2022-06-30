import { Box, Flex, HStack, Text, Container } from '@chakra-ui/react';

import NavButtonLink from './navButtonLink';
import InternalLink from './internalLink';

type Props = {
    children: React.ReactNode;
};

const navbarHeight = 12;

const Layout = ({ children }: Props) => (
    <Box bg="gray.100" minHeight="100vh" pt={navbarHeight + 2}>
        <Box
            as="header"
            position="fixed"
            top={0}
            left={0}
            w="100%"
            h={navbarHeight}
            bg="white"
            borderBottomWidth="1px"
            borderBottomColor="gray.300"
        >
            <Flex align="center" justify="space-between" px={5} h="100%">
                <HStack spacing={2} fontSize="md">
                    <Box mr={1}>
                        <InternalLink href="/" _hover={{}}>
                            <Text fontWeight="bold">DG Roundup</Text>
                        </InternalLink>
                    </Box>
                    <NavButtonLink href="/recent" label="Recent" />
                    <NavButtonLink href="/archives" label="Archives" />
                </HStack>
            </Flex>
        </Box>
        <Container maxW="container.sm">
            <Box as="main">
                <Box>{children}</Box>
            </Box>
        </Container>
        <Box as="footer"></Box>
    </Box>
);

export default Layout;
