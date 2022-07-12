import { Box, Flex, HStack, useDisclosure, Text, Button } from '@chakra-ui/react';

import Logo from '../logo';
import NavLink from './navLink';
import HelpModal from './helpModal';

export const navbarHeight = 14;

const Header = () => {
    const { isOpen, onOpen, onClose } = useDisclosure();

    return (
        <>
            <Box
                as="header"
                position="fixed"
                top={0}
                left={0}
                w="100%"
                h={navbarHeight}
                bg="neutral.800"
                borderBottomWidth="1px"
                borderBottomColor="neutral.200"
            >
                <Flex align="center" justify="space-between" px={8} h="100%">
                    <HStack spacing={6} fontSize="md">
                        <Box>
                            <Logo />
                        </Box>
                        <NavLink href="/recent" label="Recent" />
                        <NavLink href="/archives" label="Archives" />
                    </HStack>
                    <Button
                        variant="link"
                        onClick={onOpen}
                        color="neutral.100"
                        _hover={{ textDecoration: 'none', color: 'white' }}
                    >
                        <Text fontSize="xl" fontWeight="bold">
                            &#x24D8;
                        </Text>
                    </Button>
                </Flex>
            </Box>
            <HelpModal isOpen={isOpen} onClose={onClose} />
        </>
    );
};

export default Header;
