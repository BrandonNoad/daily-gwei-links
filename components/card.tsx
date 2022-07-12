import { Box } from '@chakra-ui/react';

type Props = {
    children: React.ReactNode;
    [rest: string]: any;
};

const Card = ({ children, ...rest }: Props) => (
    <Box
        bg="white"
        borderRadius="md"
        boxShadow="base"
        borderWidth="1px"
        borderColor="neutral.200"
        _hover={{ borderColor: 'neutral.300' }}
        {...rest}
    >
        {children}
    </Box>
);

export default Card;
