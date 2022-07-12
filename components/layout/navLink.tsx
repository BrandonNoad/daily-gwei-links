import { useRouter } from 'next/router';

import { Text } from '@chakra-ui/react';

import InternalLink from '../internalLink';

type Props = {
    href: string;
    label: string;
};

const NavLink = ({ href, label }: Props) => {
    const router = useRouter();

    const color =
        router.asPath.toLowerCase().indexOf(href.toLowerCase()) === 0
            ? { default: 'primary.400', hover: 'primary.400' }
            : { default: 'neutral.100', hover: 'white' };

    return (
        <InternalLink
            href={href}
            textDecoration="none"
            color={color.default}
            _hover={{ color: color.hover }}
        >
            <Text fontWeight="bold">{label}</Text>
        </InternalLink>
    );
};

export default NavLink;
