import { Box } from '@chakra-ui/react';
import { Image, Transformation } from 'cloudinary-react';

import InternalLink from './internalLink';

const Logo = () => (
    <Box width="32px" color="gray.800">
        <InternalLink href="/">
            <Image secure cloudName="noad" publicId="fuel_rifcsf.webp" alt="logo">
                <Transformation quality="auto" fetchFormat="auto" />
            </Image>
        </InternalLink>
    </Box>
);

export default Logo;
