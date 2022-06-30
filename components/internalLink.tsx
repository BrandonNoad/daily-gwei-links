import NextLink from 'next/link';
import { Link } from '@chakra-ui/react';

type Props = {
    href: string;
    children: React.ReactNode;
    [rest: string]: any;
};

const InternalLink = ({ href, children, ...rest }: Props) => (
    <NextLink href={href} passHref>
        <Link {...rest}>{children}</Link>
    </NextLink>
);

export default InternalLink;
