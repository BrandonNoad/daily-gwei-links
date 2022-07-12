import { Box, Flex, HStack, Icon, VisuallyHidden, Square, Link, Text } from '@chakra-ui/react';
import { SiYoutube, SiDiscord, SiGithub } from 'react-icons/si';

const Footer = () => (
    <Box as="footer" position="absolute" bottom={0} left={0} w="100%" px={[3, 5, 8]}>
        <Flex
            align="center"
            justify="space-between"
            py={4}
            borderTop="1px"
            borderTopColor="neutral.200"
            color="neutral.400"
        >
            <Box>
                <Text fontSize="sm">This is the Gwei &#x1F987; &#x1F50A; &#x39E;</Text>
            </Box>
            <HStack spacing={4}>
                <Square size={6}>
                    <Link
                        href="https://www.youtube.com/c/TheDailyGwei"
                        w="100%"
                        h="100%"
                        _hover={{ color: 'neutral.500' }}
                    >
                        <VisuallyHidden>YouTube</VisuallyHidden>
                        <Icon as={SiYoutube} w="100%" h="100%" />
                    </Link>
                </Square>
                <Square size={6}>
                    <Link
                        href="https://discord.com/invite/4pfUJsENcg"
                        w="100%"
                        h="100%"
                        _hover={{ color: 'neutral.500' }}
                    >
                        <VisuallyHidden>Discord</VisuallyHidden>
                        <Icon as={SiDiscord} w="100%" h="100%" />
                    </Link>
                </Square>
                <Square size={6}>
                    <Link
                        href="https://github.com/BrandonNoad/daily-gwei-links"
                        w="100%"
                        h="100%"
                        _hover={{ color: 'neutral.500' }}
                    >
                        <VisuallyHidden>GitHub</VisuallyHidden>
                        <Icon as={SiGithub} w="100%" h="100%" />
                    </Link>
                </Square>
            </HStack>
        </Flex>
    </Box>
);

export default Footer;
