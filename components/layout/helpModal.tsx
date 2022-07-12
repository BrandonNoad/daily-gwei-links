import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    Text,
    Link
} from '@chakra-ui/react';

type Props = {
    isOpen: boolean;
    onClose: () => void;
};

const AboutLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <Link color="primary.800" _hover={{ color: 'primary.900' }} href={href}>
        {children}
    </Link>
);

const HelpModal = ({ isOpen, onClose }: Props) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} size={['sm', 'md', 'lg']}>
            <ModalOverlay />
            <ModalContent p={[4, 5, 6]}>
                <ModalHeader fontSize="2xl" fontWeight="bold" p={0} mb={4} color="neutral.900">
                    About
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody p={0} mb={2} color="neutral.800">
                    <Text mb={2}>
                        The content on this website is auto-generated from{' '}
                        <AboutLink href="https://www.youtube.com/playlist?list=PLIMWH1uKd3oE905uSUHdE5hd6e2UpADak">
                            The Daily Gwei Refuel
                        </AboutLink>{' '}
                        YouTube video descriptions.
                    </Text>
                    <Text>
                        This website is{' '}
                        <Text as="span" fontWeight="semibold">
                            not
                        </Text>{' '}
                        directly affiliated with The Daily Gwei, but if you find the content
                        valuable, please subscribe to The Daily Gwei{' '}
                        <AboutLink href="https://www.youtube.com/c/TheDailyGwei">
                            YouTube channel
                        </AboutLink>{' '}
                        and its{' '}
                        <AboutLink href="https://thedailygwei.substack.com">newsletter</AboutLink>,
                        follow The Daily Gwei founder{' '}
                        <AboutLink href="https://twitter.com/sassal0x">
                            @sassal0x on Twitter
                        </AboutLink>
                        , and join The Daily Gwei{' '}
                        <AboutLink href="https://discord.gg/4pfUJsENcg">
                            Discord community
                        </AboutLink>
                        .
                    </Text>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default HelpModal;
