import type { NextApiRequest, NextApiResponse } from 'next';
// import type { FrameActionMessage } from '@farcaster/core';

import { ethers } from 'ethers';
import { z } from 'zod';
import { parseISO, format } from 'date-fns';
import Axios from 'axios';
// import { Message } from '@farcaster/core';

import { fetchVideosByKeyword } from '../../../util/airtable';
import { generateImageUrl } from '../../../util/ogImage';

const BASE_URL = process.env.BASE_URL ?? 'https://daily-gwei-links.vercel.app';

const CONTRACT_ABI = [
    // { inputs: [], name: 'ApprovalCallerNotOwnerNorApproved', type: 'error' },
    // { inputs: [], name: 'ApprovalQueryForNonexistentToken', type: 'error' },
    // { inputs: [], name: 'BalanceQueryForZeroAddress', type: 'error' },
    // { inputs: [], name: 'ExceedsAddressBatchMintLimit', type: 'error' },
    // {
    //     inputs: [{ internalType: 'uint32', name: 'available', type: 'uint32' }],
    //     name: 'ExceedsEditionAvailableSupply',
    //     type: 'error'
    // },
    // { inputs: [], name: 'InvalidAmount', type: 'error' },
    // { inputs: [], name: 'InvalidEditionMaxMintableRange', type: 'error' },
    // { inputs: [], name: 'InvalidFundingRecipient', type: 'error' },
    // { inputs: [], name: 'InvalidQueryRange', type: 'error' },
    // { inputs: [], name: 'InvalidRandomnessLock', type: 'error' },
    // { inputs: [], name: 'InvalidRoyaltyBPS', type: 'error' },
    // { inputs: [], name: 'MaximumHasAlreadyBeenReached', type: 'error' },
    // { inputs: [], name: 'MetadataIsFrozen', type: 'error' },
    // { inputs: [], name: 'MintERC2309QuantityExceedsLimit', type: 'error' },
    // { inputs: [], name: 'MintHasConcluded', type: 'error' },
    // { inputs: [], name: 'MintRandomnessAlreadyRevealed', type: 'error' },
    // { inputs: [], name: 'MintToZeroAddress', type: 'error' },
    // { inputs: [], name: 'MintZeroQuantity', type: 'error' },
    // { inputs: [], name: 'MintsAlreadyExist', type: 'error' },
    // { inputs: [], name: 'NewOwnerIsZeroAddress', type: 'error' },
    // { inputs: [], name: 'NoAddressesToAirdrop', type: 'error' },
    // { inputs: [], name: 'NoHandoverRequest', type: 'error' },
    // { inputs: [], name: 'OwnerQueryForNonexistentToken', type: 'error' },
    // { inputs: [], name: 'OwnershipNotInitializedForExtraData', type: 'error' },
    // { inputs: [], name: 'TransferCallerNotOwnerNorApproved', type: 'error' },
    // { inputs: [], name: 'TransferFromIncorrectOwner', type: 'error' },
    // { inputs: [], name: 'TransferToNonERC721ReceiverImplementer', type: 'error' },
    // { inputs: [], name: 'TransferToZeroAddress', type: 'error' },
    // { inputs: [], name: 'URIQueryForNonexistentToken', type: 'error' },
    // { inputs: [], name: 'Unauthorized', type: 'error' },
    // {
    //     anonymous: false,
    //     inputs: [
    //         { indexed: true, internalType: 'address', name: 'owner', type: 'address' },
    //         { indexed: true, internalType: 'address', name: 'approved', type: 'address' },
    //         { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' }
    //     ],
    //     name: 'Approval',
    //     type: 'event'
    // },
    // {
    //     anonymous: false,
    //     inputs: [
    //         { indexed: true, internalType: 'address', name: 'owner', type: 'address' },
    //         { indexed: true, internalType: 'address', name: 'operator', type: 'address' },
    //         { indexed: false, internalType: 'bool', name: 'approved', type: 'bool' }
    //     ],
    //     name: 'ApprovalForAll',
    //     type: 'event'
    // },
    // {
    //     anonymous: false,
    //     inputs: [{ indexed: false, internalType: 'string', name: 'baseURI', type: 'string' }],
    //     name: 'BaseURISet',
    //     type: 'event'
    // },
    // {
    //     anonymous: false,
    //     inputs: [
    //         { indexed: true, internalType: 'uint256', name: 'fromTokenId', type: 'uint256' },
    //         { indexed: false, internalType: 'uint256', name: 'toTokenId', type: 'uint256' },
    //         { indexed: true, internalType: 'address', name: 'from', type: 'address' },
    //         { indexed: true, internalType: 'address', name: 'to', type: 'address' }
    //     ],
    //     name: 'ConsecutiveTransfer',
    //     type: 'event'
    // },
    // {
    //     anonymous: false,
    //     inputs: [{ indexed: false, internalType: 'string', name: 'contractURI', type: 'string' }],
    //     name: 'ContractURISet',
    //     type: 'event'
    // },
    // {
    //     anonymous: false,
    //     inputs: [
    //         { indexed: false, internalType: 'uint32', name: 'editionCutoffTime_', type: 'uint32' }
    //     ],
    //     name: 'EditionCutoffTimeSet',
    //     type: 'event'
    // },
    // {
    //     anonymous: false,
    //     inputs: [
    //         {
    //             indexed: false,
    //             internalType: 'uint32',
    //             name: 'editionMaxMintableLower_',
    //             type: 'uint32'
    //         },
    //         {
    //             indexed: false,
    //             internalType: 'uint32',
    //             name: 'editionMaxMintableUpper_',
    //             type: 'uint32'
    //         }
    //     ],
    //     name: 'EditionMaxMintableRangeSet',
    //     type: 'event'
    // },
    // {
    //     anonymous: false,
    //     inputs: [
    //         { indexed: false, internalType: 'address', name: 'fundingRecipient', type: 'address' }
    //     ],
    //     name: 'FundingRecipientSet',
    //     type: 'event'
    // },
    // {
    //     anonymous: false,
    //     inputs: [
    //         { indexed: false, internalType: 'address', name: 'metadataModule', type: 'address' },
    //         { indexed: false, internalType: 'string', name: 'baseURI', type: 'string' },
    //         { indexed: false, internalType: 'string', name: 'contractURI', type: 'string' }
    //     ],
    //     name: 'MetadataFrozen',
    //     type: 'event'
    // },
    // {
    //     anonymous: false,
    //     inputs: [
    //         { indexed: false, internalType: 'address', name: 'metadataModule', type: 'address' }
    //     ],
    //     name: 'MetadataModuleSet',
    //     type: 'event'
    // },
    // {
    //     anonymous: false,
    //     inputs: [
    //         { indexed: false, internalType: 'bool', name: 'mintRandomnessEnabled_', type: 'bool' }
    //     ],
    //     name: 'MintRandomnessEnabledSet',
    //     type: 'event'
    // },
    // {
    //     anonymous: false,
    //     inputs: [{ indexed: true, internalType: 'address', name: 'pendingOwner', type: 'address' }],
    //     name: 'OwnershipHandoverCanceled',
    //     type: 'event'
    // },
    // {
    //     anonymous: false,
    //     inputs: [{ indexed: true, internalType: 'address', name: 'pendingOwner', type: 'address' }],
    //     name: 'OwnershipHandoverRequested',
    //     type: 'event'
    // },
    // {
    //     anonymous: false,
    //     inputs: [
    //         { indexed: true, internalType: 'address', name: 'oldOwner', type: 'address' },
    //         { indexed: true, internalType: 'address', name: 'newOwner', type: 'address' }
    //     ],
    //     name: 'OwnershipTransferred',
    //     type: 'event'
    // },
    // {
    //     anonymous: false,
    //     inputs: [
    //         { indexed: true, internalType: 'address', name: 'user', type: 'address' },
    //         { indexed: true, internalType: 'uint256', name: 'roles', type: 'uint256' }
    //     ],
    //     name: 'RolesUpdated',
    //     type: 'event'
    // },
    // {
    //     anonymous: false,
    //     inputs: [{ indexed: false, internalType: 'uint16', name: 'bps', type: 'uint16' }],
    //     name: 'RoyaltySet',
    //     type: 'event'
    // },
    // {
    //     anonymous: false,
    //     inputs: [
    //         { indexed: true, internalType: 'address', name: 'edition_', type: 'address' },
    //         { indexed: false, internalType: 'string', name: 'name_', type: 'string' },
    //         { indexed: false, internalType: 'string', name: 'symbol_', type: 'string' },
    //         { indexed: false, internalType: 'address', name: 'metadataModule_', type: 'address' },
    //         { indexed: false, internalType: 'string', name: 'baseURI_', type: 'string' },
    //         { indexed: false, internalType: 'string', name: 'contractURI_', type: 'string' },
    //         { indexed: false, internalType: 'address', name: 'fundingRecipient_', type: 'address' },
    //         { indexed: false, internalType: 'uint16', name: 'royaltyBPS_', type: 'uint16' },
    //         {
    //             indexed: false,
    //             internalType: 'uint32',
    //             name: 'editionMaxMintableLower_',
    //             type: 'uint32'
    //         },
    //         {
    //             indexed: false,
    //             internalType: 'uint32',
    //             name: 'editionMaxMintableUpper_',
    //             type: 'uint32'
    //         },
    //         { indexed: false, internalType: 'uint32', name: 'editionCutoffTime_', type: 'uint32' },
    //         { indexed: false, internalType: 'uint8', name: 'flags_', type: 'uint8' }
    //     ],
    //     name: 'SoundEditionInitialized',
    //     type: 'event'
    // },
    // {
    //     anonymous: false,
    //     inputs: [
    //         { indexed: true, internalType: 'address', name: 'from', type: 'address' },
    //         { indexed: true, internalType: 'address', name: 'to', type: 'address' },
    //         { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' }
    //     ],
    //     name: 'Transfer',
    //     type: 'event'
    // },
    // {
    //     inputs: [],
    //     name: 'ADDRESS_BATCH_MINT_LIMIT',
    //     outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    //     stateMutability: 'view',
    //     type: 'function'
    // },
    // {
    //     inputs: [],
    //     name: 'ADMIN_ROLE',
    //     outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    //     stateMutability: 'view',
    //     type: 'function'
    // },
    // {
    //     inputs: [],
    //     name: 'METADATA_IS_FROZEN_FLAG',
    //     outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    //     stateMutability: 'view',
    //     type: 'function'
    // },
    // {
    //     inputs: [],
    //     name: 'MINTER_ROLE',
    //     outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    //     stateMutability: 'view',
    //     type: 'function'
    // },
    // {
    //     inputs: [],
    //     name: 'MINT_RANDOMNESS_ENABLED_FLAG',
    //     outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    //     stateMutability: 'view',
    //     type: 'function'
    // },
    // {
    //     inputs: [
    //         { internalType: 'address[]', name: 'to', type: 'address[]' },
    //         { internalType: 'uint256', name: 'quantity', type: 'uint256' }
    //     ],
    //     name: 'airdrop',
    //     outputs: [{ internalType: 'uint256', name: 'fromTokenId', type: 'uint256' }],
    //     stateMutability: 'nonpayable',
    //     type: 'function'
    // },
    // {
    //     inputs: [
    //         { internalType: 'address', name: 'to', type: 'address' },
    //         { internalType: 'uint256', name: 'tokenId', type: 'uint256' }
    //     ],
    //     name: 'approve',
    //     outputs: [],
    //     stateMutability: 'nonpayable',
    //     type: 'function'
    // },
    {
        inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function'
    }
    // {
    //     inputs: [],
    //     name: 'baseURI',
    //     outputs: [{ internalType: 'string', name: '', type: 'string' }],
    //     stateMutability: 'view',
    //     type: 'function'
    // },
    // {
    //     inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    //     name: 'burn',
    //     outputs: [],
    //     stateMutability: 'nonpayable',
    //     type: 'function'
    // },
    // {
    //     inputs: [],
    //     name: 'cancelOwnershipHandover',
    //     outputs: [],
    //     stateMutability: 'nonpayable',
    //     type: 'function'
    // },
    // {
    //     inputs: [{ internalType: 'address', name: 'pendingOwner', type: 'address' }],
    //     name: 'completeOwnershipHandover',
    //     outputs: [],
    //     stateMutability: 'nonpayable',
    //     type: 'function'
    // },
    // {
    //     inputs: [],
    //     name: 'contractURI',
    //     outputs: [{ internalType: 'string', name: '', type: 'string' }],
    //     stateMutability: 'view',
    //     type: 'function'
    // },
    // {
    //     inputs: [],
    //     name: 'editionCutoffTime',
    //     outputs: [{ internalType: 'uint32', name: '', type: 'uint32' }],
    //     stateMutability: 'view',
    //     type: 'function'
    // },
    // {
    //     inputs: [],
    //     name: 'editionInfo',
    //     outputs: [
    //         {
    //             components: [
    //                 { internalType: 'string', name: 'baseURI', type: 'string' },
    //                 { internalType: 'string', name: 'contractURI', type: 'string' },
    //                 { internalType: 'string', name: 'name', type: 'string' },
    //                 { internalType: 'string', name: 'symbol', type: 'string' },
    //                 { internalType: 'address', name: 'fundingRecipient', type: 'address' },
    //                 { internalType: 'uint32', name: 'editionMaxMintable', type: 'uint32' },
    //                 { internalType: 'uint32', name: 'editionMaxMintableUpper', type: 'uint32' },
    //                 { internalType: 'uint32', name: 'editionMaxMintableLower', type: 'uint32' },
    //                 { internalType: 'uint32', name: 'editionCutoffTime', type: 'uint32' },
    //                 { internalType: 'address', name: 'metadataModule', type: 'address' },
    //                 { internalType: 'uint256', name: 'mintRandomness', type: 'uint256' },
    //                 { internalType: 'uint16', name: 'royaltyBPS', type: 'uint16' },
    //                 { internalType: 'bool', name: 'mintRandomnessEnabled', type: 'bool' },
    //                 { internalType: 'bool', name: 'mintConcluded', type: 'bool' },
    //                 { internalType: 'bool', name: 'isMetadataFrozen', type: 'bool' },
    //                 { internalType: 'uint256', name: 'nextTokenId', type: 'uint256' },
    //                 { internalType: 'uint256', name: 'totalBurned', type: 'uint256' },
    //                 { internalType: 'uint256', name: 'totalMinted', type: 'uint256' },
    //                 { internalType: 'uint256', name: 'totalSupply', type: 'uint256' }
    //             ],
    //             internalType: 'struct EditionInfo',
    //             name: 'info',
    //             type: 'tuple'
    //         }
    //     ],
    //     stateMutability: 'view',
    //     type: 'function'
    // },
    // {
    //     inputs: [],
    //     name: 'editionMaxMintable',
    //     outputs: [{ internalType: 'uint32', name: '', type: 'uint32' }],
    //     stateMutability: 'view',
    //     type: 'function'
    // },
    // {
    //     inputs: [],
    //     name: 'editionMaxMintableLower',
    //     outputs: [{ internalType: 'uint32', name: '', type: 'uint32' }],
    //     stateMutability: 'view',
    //     type: 'function'
    // },
    // {
    //     inputs: [],
    //     name: 'editionMaxMintableUpper',
    //     outputs: [{ internalType: 'uint32', name: '', type: 'uint32' }],
    //     stateMutability: 'view',
    //     type: 'function'
    // },
    // {
    //     inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    //     name: 'explicitOwnershipOf',
    //     outputs: [
    //         {
    //             components: [
    //                 { internalType: 'address', name: 'addr', type: 'address' },
    //                 { internalType: 'uint64', name: 'startTimestamp', type: 'uint64' },
    //                 { internalType: 'bool', name: 'burned', type: 'bool' },
    //                 { internalType: 'uint24', name: 'extraData', type: 'uint24' }
    //             ],
    //             internalType: 'struct IERC721AUpgradeable.TokenOwnership',
    //             name: '',
    //             type: 'tuple'
    //         }
    //     ],
    //     stateMutability: 'view',
    //     type: 'function'
    // },
    // {
    //     inputs: [{ internalType: 'uint256[]', name: 'tokenIds', type: 'uint256[]' }],
    //     name: 'explicitOwnershipsOf',
    //     outputs: [
    //         {
    //             components: [
    //                 { internalType: 'address', name: 'addr', type: 'address' },
    //                 { internalType: 'uint64', name: 'startTimestamp', type: 'uint64' },
    //                 { internalType: 'bool', name: 'burned', type: 'bool' },
    //                 { internalType: 'uint24', name: 'extraData', type: 'uint24' }
    //             ],
    //             internalType: 'struct IERC721AUpgradeable.TokenOwnership[]',
    //             name: '',
    //             type: 'tuple[]'
    //         }
    //     ],
    //     stateMutability: 'view',
    //     type: 'function'
    // },
    // {
    //     inputs: [],
    //     name: 'freezeMetadata',
    //     outputs: [],
    //     stateMutability: 'nonpayable',
    //     type: 'function'
    // },
    // {
    //     inputs: [],
    //     name: 'fundingRecipient',
    //     outputs: [{ internalType: 'address', name: '', type: 'address' }],
    //     stateMutability: 'view',
    //     type: 'function'
    // },
    // {
    //     inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    //     name: 'getApproved',
    //     outputs: [{ internalType: 'address', name: '', type: 'address' }],
    //     stateMutability: 'view',
    //     type: 'function'
    // },
    // {
    //     inputs: [
    //         { internalType: 'address', name: 'user', type: 'address' },
    //         { internalType: 'uint256', name: 'roles', type: 'uint256' }
    //     ],
    //     name: 'grantRoles',
    //     outputs: [],
    //     stateMutability: 'nonpayable',
    //     type: 'function'
    // },
    // {
    //     inputs: [
    //         { internalType: 'address', name: 'user', type: 'address' },
    //         { internalType: 'uint256', name: 'roles', type: 'uint256' }
    //     ],
    //     name: 'hasAllRoles',
    //     outputs: [{ internalType: 'bool', name: 'result', type: 'bool' }],
    //     stateMutability: 'view',
    //     type: 'function'
    // },
    // {
    //     inputs: [
    //         { internalType: 'address', name: 'user', type: 'address' },
    //         { internalType: 'uint256', name: 'roles', type: 'uint256' }
    //     ],
    //     name: 'hasAnyRole',
    //     outputs: [{ internalType: 'bool', name: 'result', type: 'bool' }],
    //     stateMutability: 'view',
    //     type: 'function'
    // },
    // {
    //     inputs: [
    //         { internalType: 'string', name: 'name_', type: 'string' },
    //         { internalType: 'string', name: 'symbol_', type: 'string' },
    //         { internalType: 'address', name: 'metadataModule_', type: 'address' },
    //         { internalType: 'string', name: 'baseURI_', type: 'string' },
    //         { internalType: 'string', name: 'contractURI_', type: 'string' },
    //         { internalType: 'address', name: 'fundingRecipient_', type: 'address' },
    //         { internalType: 'uint16', name: 'royaltyBPS_', type: 'uint16' },
    //         { internalType: 'uint32', name: 'editionMaxMintableLower_', type: 'uint32' },
    //         { internalType: 'uint32', name: 'editionMaxMintableUpper_', type: 'uint32' },
    //         { internalType: 'uint32', name: 'editionCutoffTime_', type: 'uint32' },
    //         { internalType: 'uint8', name: 'flags_', type: 'uint8' }
    //     ],
    //     name: 'initialize',
    //     outputs: [],
    //     stateMutability: 'nonpayable',
    //     type: 'function'
    // },
    // {
    //     inputs: [
    //         { internalType: 'address', name: 'owner', type: 'address' },
    //         { internalType: 'address', name: 'operator', type: 'address' }
    //     ],
    //     name: 'isApprovedForAll',
    //     outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    //     stateMutability: 'view',
    //     type: 'function'
    // },
    // {
    //     inputs: [],
    //     name: 'isMetadataFrozen',
    //     outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    //     stateMutability: 'view',
    //     type: 'function'
    // },
    // {
    //     inputs: [],
    //     name: 'metadataModule',
    //     outputs: [{ internalType: 'address', name: '', type: 'address' }],
    //     stateMutability: 'view',
    //     type: 'function'
    // },
    // {
    //     inputs: [
    //         { internalType: 'address', name: 'to', type: 'address' },
    //         { internalType: 'uint256', name: 'quantity', type: 'uint256' }
    //     ],
    //     name: 'mint',
    //     outputs: [{ internalType: 'uint256', name: 'fromTokenId', type: 'uint256' }],
    //     stateMutability: 'payable',
    //     type: 'function'
    // },
    // {
    //     inputs: [],
    //     name: 'mintConcluded',
    //     outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    //     stateMutability: 'view',
    //     type: 'function'
    // },
    // {
    //     inputs: [],
    //     name: 'mintRandomness',
    //     outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    //     stateMutability: 'view',
    //     type: 'function'
    // },
    // {
    //     inputs: [],
    //     name: 'mintRandomnessEnabled',
    //     outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    //     stateMutability: 'view',
    //     type: 'function'
    // },
    // {
    //     inputs: [],
    //     name: 'name',
    //     outputs: [{ internalType: 'string', name: '', type: 'string' }],
    //     stateMutability: 'view',
    //     type: 'function'
    // },
    // {
    //     inputs: [],
    //     name: 'nextTokenId',
    //     outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    //     stateMutability: 'view',
    //     type: 'function'
    // },
    // {
    //     inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
    //     name: 'numberBurned',
    //     outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    //     stateMutability: 'view',
    //     type: 'function'
    // },
    // {
    //     inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
    //     name: 'numberMinted',
    //     outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    //     stateMutability: 'view',
    //     type: 'function'
    // },
    // {
    //     inputs: [{ internalType: 'uint256', name: 'roles', type: 'uint256' }],
    //     name: 'ordinalsFromRoles',
    //     outputs: [{ internalType: 'uint8[]', name: 'ordinals', type: 'uint8[]' }],
    //     stateMutability: 'pure',
    //     type: 'function'
    // },
    // {
    //     inputs: [],
    //     name: 'owner',
    //     outputs: [{ internalType: 'address', name: 'result', type: 'address' }],
    //     stateMutability: 'view',
    //     type: 'function'
    // },
    // {
    //     inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    //     name: 'ownerOf',
    //     outputs: [{ internalType: 'address', name: '', type: 'address' }],
    //     stateMutability: 'view',
    //     type: 'function'
    // },
    // {
    //     inputs: [{ internalType: 'address', name: 'pendingOwner', type: 'address' }],
    //     name: 'ownershipHandoverExpiresAt',
    //     outputs: [{ internalType: 'uint256', name: 'result', type: 'uint256' }],
    //     stateMutability: 'view',
    //     type: 'function'
    // },
    // {
    //     inputs: [],
    //     name: 'ownershipHandoverValidFor',
    //     outputs: [{ internalType: 'uint64', name: '', type: 'uint64' }],
    //     stateMutability: 'view',
    //     type: 'function'
    // },
    // {
    //     inputs: [],
    //     name: 'renounceOwnership',
    //     outputs: [],
    //     stateMutability: 'nonpayable',
    //     type: 'function'
    // },
    // {
    //     inputs: [{ internalType: 'uint256', name: 'roles', type: 'uint256' }],
    //     name: 'renounceRoles',
    //     outputs: [],
    //     stateMutability: 'nonpayable',
    //     type: 'function'
    // },
    // {
    //     inputs: [],
    //     name: 'requestOwnershipHandover',
    //     outputs: [],
    //     stateMutability: 'nonpayable',
    //     type: 'function'
    // },
    // {
    //     inputs: [
    //         { internalType: 'address', name: 'user', type: 'address' },
    //         { internalType: 'uint256', name: 'roles', type: 'uint256' }
    //     ],
    //     name: 'revokeRoles',
    //     outputs: [],
    //     stateMutability: 'nonpayable',
    //     type: 'function'
    // },
    // {
    //     inputs: [{ internalType: 'uint8[]', name: 'ordinals', type: 'uint8[]' }],
    //     name: 'rolesFromOrdinals',
    //     outputs: [{ internalType: 'uint256', name: 'roles', type: 'uint256' }],
    //     stateMutability: 'pure',
    //     type: 'function'
    // },
    // {
    //     inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    //     name: 'rolesOf',
    //     outputs: [{ internalType: 'uint256', name: 'roles', type: 'uint256' }],
    //     stateMutability: 'view',
    //     type: 'function'
    // },
    // {
    //     inputs: [],
    //     name: 'royaltyBPS',
    //     outputs: [{ internalType: 'uint16', name: '', type: 'uint16' }],
    //     stateMutability: 'view',
    //     type: 'function'
    // },
    // {
    //     inputs: [
    //         { internalType: 'uint256', name: '', type: 'uint256' },
    //         { internalType: 'uint256', name: 'salePrice', type: 'uint256' }
    //     ],
    //     name: 'royaltyInfo',
    //     outputs: [
    //         { internalType: 'address', name: 'fundingRecipient_', type: 'address' },
    //         { internalType: 'uint256', name: 'royaltyAmount', type: 'uint256' }
    //     ],
    //     stateMutability: 'view',
    //     type: 'function'
    // },
    // {
    //     inputs: [
    //         { internalType: 'address', name: 'from', type: 'address' },
    //         { internalType: 'address', name: 'to', type: 'address' },
    //         { internalType: 'uint256', name: 'tokenId', type: 'uint256' }
    //     ],
    //     name: 'safeTransferFrom',
    //     outputs: [],
    //     stateMutability: 'nonpayable',
    //     type: 'function'
    // },
    // {
    //     inputs: [
    //         { internalType: 'address', name: 'from', type: 'address' },
    //         { internalType: 'address', name: 'to', type: 'address' },
    //         { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
    //         { internalType: 'bytes', name: '_data', type: 'bytes' }
    //     ],
    //     name: 'safeTransferFrom',
    //     outputs: [],
    //     stateMutability: 'nonpayable',
    //     type: 'function'
    // },
    // {
    //     inputs: [
    //         { internalType: 'address', name: 'operator', type: 'address' },
    //         { internalType: 'bool', name: 'approved', type: 'bool' }
    //     ],
    //     name: 'setApprovalForAll',
    //     outputs: [],
    //     stateMutability: 'nonpayable',
    //     type: 'function'
    // },
    // {
    //     inputs: [{ internalType: 'string', name: 'baseURI_', type: 'string' }],
    //     name: 'setBaseURI',
    //     outputs: [],
    //     stateMutability: 'nonpayable',
    //     type: 'function'
    // },
    // {
    //     inputs: [{ internalType: 'string', name: 'contractURI_', type: 'string' }],
    //     name: 'setContractURI',
    //     outputs: [],
    //     stateMutability: 'nonpayable',
    //     type: 'function'
    // },
    // {
    //     inputs: [{ internalType: 'uint32', name: 'editionCutoffTime_', type: 'uint32' }],
    //     name: 'setEditionCutoffTime',
    //     outputs: [],
    //     stateMutability: 'nonpayable',
    //     type: 'function'
    // },
    // {
    //     inputs: [
    //         { internalType: 'uint32', name: 'editionMaxMintableLower_', type: 'uint32' },
    //         { internalType: 'uint32', name: 'editionMaxMintableUpper_', type: 'uint32' }
    //     ],
    //     name: 'setEditionMaxMintableRange',
    //     outputs: [],
    //     stateMutability: 'nonpayable',
    //     type: 'function'
    // },
    // {
    //     inputs: [{ internalType: 'address', name: 'fundingRecipient_', type: 'address' }],
    //     name: 'setFundingRecipient',
    //     outputs: [],
    //     stateMutability: 'nonpayable',
    //     type: 'function'
    // },
    // {
    //     inputs: [{ internalType: 'address', name: 'metadataModule_', type: 'address' }],
    //     name: 'setMetadataModule',
    //     outputs: [],
    //     stateMutability: 'nonpayable',
    //     type: 'function'
    // },
    // {
    //     inputs: [{ internalType: 'bool', name: 'mintRandomnessEnabled_', type: 'bool' }],
    //     name: 'setMintRandomnessEnabled',
    //     outputs: [],
    //     stateMutability: 'nonpayable',
    //     type: 'function'
    // },
    // {
    //     inputs: [{ internalType: 'uint16', name: 'royaltyBPS_', type: 'uint16' }],
    //     name: 'setRoyalty',
    //     outputs: [],
    //     stateMutability: 'nonpayable',
    //     type: 'function'
    // },
    // {
    //     inputs: [{ internalType: 'bytes4', name: 'interfaceId', type: 'bytes4' }],
    //     name: 'supportsInterface',
    //     outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    //     stateMutability: 'view',
    //     type: 'function'
    // },
    // {
    //     inputs: [],
    //     name: 'symbol',
    //     outputs: [{ internalType: 'string', name: '', type: 'string' }],
    //     stateMutability: 'view',
    //     type: 'function'
    // },
    // {
    //     inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    //     name: 'tokenURI',
    //     outputs: [{ internalType: 'string', name: '', type: 'string' }],
    //     stateMutability: 'view',
    //     type: 'function'
    // },
    // {
    //     inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
    //     name: 'tokensOfOwner',
    //     outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }],
    //     stateMutability: 'view',
    //     type: 'function'
    // },
    // {
    //     inputs: [
    //         { internalType: 'address', name: 'owner', type: 'address' },
    //         { internalType: 'uint256', name: 'start', type: 'uint256' },
    //         { internalType: 'uint256', name: 'stop', type: 'uint256' }
    //     ],
    //     name: 'tokensOfOwnerIn',
    //     outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }],
    //     stateMutability: 'view',
    //     type: 'function'
    // },
    // {
    //     inputs: [],
    //     name: 'totalBurned',
    //     outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    //     stateMutability: 'view',
    //     type: 'function'
    // },
    // {
    //     inputs: [],
    //     name: 'totalMinted',
    //     outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    //     stateMutability: 'view',
    //     type: 'function'
    // },
    // {
    //     inputs: [],
    //     name: 'totalSupply',
    //     outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    //     stateMutability: 'view',
    //     type: 'function'
    // },
    // {
    //     inputs: [
    //         { internalType: 'address', name: 'from', type: 'address' },
    //         { internalType: 'address', name: 'to', type: 'address' },
    //         { internalType: 'uint256', name: 'tokenId', type: 'uint256' }
    //     ],
    //     name: 'transferFrom',
    //     outputs: [],
    //     stateMutability: 'nonpayable',
    //     type: 'function'
    // },
    // {
    //     inputs: [{ internalType: 'address', name: 'newOwner', type: 'address' }],
    //     name: 'transferOwnership',
    //     outputs: [],
    //     stateMutability: 'nonpayable',
    //     type: 'function'
    // },
    // {
    //     inputs: [{ internalType: 'address[]', name: 'tokens', type: 'address[]' }],
    //     name: 'withdrawERC20',
    //     outputs: [],
    //     stateMutability: 'nonpayable',
    //     type: 'function'
    // },
    // {
    //     inputs: [],
    //     name: 'withdrawETH',
    //     outputs: [],
    //     stateMutability: 'nonpayable',
    //     type: 'function'
    // }
];

const contractAllowlist = [
    // Bankless - The SBF vs. Erik Voorhees Debate
    { address: '0xe60A7e1A1ee79832f8f8042b0CFFB2EaDdb5E6C0' },

    // The Daily Gwei - 1 Year Anniversary NFT
    { address: '0x23294eF5BD5ec2fca40904f7Cd4A48e73781f207' }
];

const ethereumAddressAllowlist: string[] = [];

const verificationsByFidBodySchema = z.object({
    messages: z.array(
        z.object({
            data: z.object({
                type: z.enum(['MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS']),
                verificationAddEthAddressBody: z.object({
                    address: z.string()
                })
            })
        })
    )
});

const validateMessageBodySchema = z.object({
    isValid: z.boolean(),
    message: z.string()
});

type FrameDataButton =
    | { action: 'post'; label: string }
    | { action: 'link'; label: string; target: string }
    | { action: 'post_redirect'; label: string };

const generateHtml = ({
    title,
    imageUrl,
    postUrl,
    buttons,
    isTextInput = false
}: {
    title: string;
    imageUrl: string;
    postUrl?: string;
    buttons: FrameDataButton[];
    isTextInput?: boolean;
}) => {
    const buttonsMeta = buttons
        .flatMap((button, idx) => {
            const buttonNumber = idx + 1;

            const tags = [
                `<meta property="fc:frame:button:${buttonNumber}" content="${button.label}" />`,
                `<meta property="fc:frame:button:${buttonNumber}:action" content="${button.action}" />`
            ];

            if (button.action === 'link') {
                tags.push(
                    `<meta property="fc:frame:button:${buttonNumber}:target" content="${button.target}" />`
                );
            }

            return tags;
        })
        .join('');

    return `<!DOCTYPE html>
    <html>
      <head>
          <title>${title}</title>
          <meta property="og:title" content="${title}" />
          <meta property="og:image" content="${imageUrl}" />
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${imageUrl}" />
          ${postUrl ? `<meta property="fc:frame:post_url" content="${postUrl}" />` : ''}
          ${
              isTextInput
                  ? '<meta property="fc:frame:input:text" content="Enter a keyword..." />'
                  : ''
          }
          ${buttonsMeta}
      </head>
    </html>`;
};

type ErrorResponse = {
    statusCode: number;
    message: string;
};

const forbidden = async ({ res }: { res: NextApiResponse }) => {
    const imageUrl = await generateImageUrl({
        fontSize: 30,
        fontWeight: 600,
        text: [
            'Sorry! You are not authorized to use this frame.',
            'Click this image to view the list of eligible NFT collections.'
        ]
    });

    return res
        .setHeader('Content-Type', 'text/html')
        .status(200)
        .send(
            generateHtml({
                title: 'The Daily Gwei Refuel Search',
                imageUrl,
                buttons: []
            })
        );
};

const noResults = async ({ res, keyword }: { res: NextApiResponse; keyword: string }) => {
    const imageUrl = await generateImageUrl({
        fontSize: 30,
        fontWeight: 600,
        text: [`No results${keyword ? ` for "${keyword}"` : ''}!`, 'Try a different keyword.']
    });

    const buttons: FrameDataButton[] = [{ label: 'Search', action: 'post' }];

    const postUrl = new URL(`${BASE_URL}/api/search/frames`);
    postUrl.searchParams.set('_', Date.now().toString());
    postUrl.searchParams.set('numButtons', buttons.length.toString());

    return res
        .setHeader('Content-Type', 'text/html')
        .status(200)
        .send(
            generateHtml({
                title: 'The Daily Gwei Refuel Search',
                imageUrl,
                postUrl: postUrl.toString(),
                buttons,
                isTextInput: true
            })
        );
};

// Example req.body
// {
//   "untrustedData": {
//     "fid": 2,
//     "url": "https://fcpolls.com/polls/1",
//     "messageHash": "0xd2b1ddc6c88e865a33cb1a565e0058d757042974",
//     "timestamp": 1706243218,
//     "network": 1,
//     "buttonIndex": 2,
//     "inputText": "hello world", // "" if requested and no input, undefined if input not requested
//     "castId": {
//       "fid": 226,
//       "hash": "0xa48dd46161d8e57725f5e26e34ec19c13ff7f3b9"
//     }
//   },
//   "trustedData": {
//     "messageBytes": "d2b1ddc6c88e865a33cb1a565e0058d757042974..."
//   }
// }

const untrustedDataSchema = z.object({
    fid: z.number(),
    inputText: z.string().optional(),
    buttonIndex: z.number()
});

const trustedDataSchema = z.object({
    messageBytes: z.string()
});

const bodySchema = z.object({
    untrustedData: untrustedDataSchema,
    trustedData: trustedDataSchema
});

type Body = z.infer<typeof bodySchema>;

const HUB_BASE_URL = 'https://www.noderpc.xyz/farcaster-mainnet-hub';

const fetchMessageData = async (
    body: Body
): Promise<
    { success: false } | { success: true; data: { fid: number } } //inputText: string | undefined; buttonIndex: number } }
> => {
    // try {
    //     const { data } = await Axios.post(
    //         `${HUB_BASE_URL}/v1/validateMessage`,
    //         hexStringToUint8Array(body.trustedData.messageBytes),
    //         {
    //             headers: { 'Content-Type': 'application/octet-stream' }
    //         }
    //     );

    //     const { isValid, message: messageJson } = validateMessageBodySchema.parse(data);

    //     if (!isValid) {
    //         return { success: false };
    //     }

    //     const message = Message.fromJSON(messageJson) as FrameActionMessage;

    //     // TODO: get inputText and buttonIndex from message.data
    //     return {
    //         success: true,
    //         data: {
    //             fid: message.data.fid
    //             // inputText: message.data.frameActionBody.inputText,
    //             // buttonIndex: message.data.frameActionBody.buttonIndex
    //         }
    //     };
    // } catch (err) {
    // TODO: Don't fall back to untrustedData
    return {
        success: true,
        data: {
            fid: body.untrustedData.fid
            // inputText: body.untrustedData.inputText,
            // buttonIndex: body.untrustedData.buttonIndex
        }
    };
    // }
};

const searchParamsSchema = z.object({
    resultIdx: z.coerce.number().optional(),
    keyword: z.string().optional(),
    numButtons: z.coerce.number()
});

const hexStringToUint8Array = (hexstring: string): Uint8Array =>
    new Uint8Array(hexstring.match(/.{1,2}/g)!.map((byte: string) => parseInt(byte, 16)));

const handler = async (req: NextApiRequest, res: NextApiResponse<string | ErrorResponse>) => {
    if (req.method !== 'POST') {
        return res.status(404).json({
            statusCode: 404,
            message: 'Not Found'
        });
    }

    const bodyParseResult = bodySchema.safeParse(req.body);

    if (!bodyParseResult.success) {
        return res.status(400).json({
            statusCode: 400,
            message: 'Bad Request'
        });
    }

    // -- Check AuthZ

    const messageDataResult = await fetchMessageData(bodyParseResult.data);

    // TODO: Don't fall back to untrustedData
    const fid = messageDataResult.success
        ? messageDataResult.data.fid
        : bodyParseResult.data.untrustedData.fid;

    // TODO: Don't fall back to untrustedData
    const { inputText, buttonIndex } = bodyParseResult.data.untrustedData;

    const verificationsByFidResponse = await Axios.get(`${HUB_BASE_URL}/v1/verificationsByFid`, {
        params: { fid: fid }
    });

    const { messages } = verificationsByFidBodySchema.parse(verificationsByFidResponse.data);

    if (messages.length === 0) {
        return forbidden({ res });
    }

    const ethereumAddress = messages[0].data.verificationAddEthAddressBody.address;

    let isAuthorized = ethereumAddressAllowlist.includes(ethereumAddress);

    if (!isAuthorized) {
        const provider = new ethers.JsonRpcProvider('https://www.noderpc.xyz/rpc-mainnet/public');

        const contracts = contractAllowlist.map(
            ({ address }) => new ethers.Contract(address, CONTRACT_ABI, provider)
        );

        const results = await Promise.all(
            contracts.map((contract) => contract.balanceOf(ethereumAddress))
        );

        isAuthorized = results.some((balance) => {
            const parseResult = z.bigint().safeParse(balance);

            return parseResult.success && parseResult.data > BigInt(0);
        });
    }

    if (!isAuthorized) {
        return forbidden({ res });
    }

    // -- "Start" frame

    if (inputText === undefined) {
        const imageUrl = await generateImageUrl({
            fontSize: 30,
            fontWeight: 600,
            text: ['Search for an episode clip using the input below', 'v0.1']
        });

        const buttons: FrameDataButton[] = [{ label: 'Search', action: 'post' }];

        const postUrl = new URL(`${BASE_URL}/api/search/frames`);
        postUrl.searchParams.set('_', Date.now().toString());
        postUrl.searchParams.set('numButtons', buttons.length.toString());

        return res
            .setHeader('Content-Type', 'text/html')
            .status(200)
            .send(
                generateHtml({
                    title: 'The Daily Gwei Refuel Search',
                    imageUrl,
                    postUrl: postUrl.toString(),
                    buttons,
                    isTextInput: true
                })
            );
    }

    const searchParamsParseResult = searchParamsSchema.safeParse(req.query);

    if (!searchParamsParseResult.success) {
        return res.status(400).json({
            statusCode: 400,
            message: 'Bad Request'
        });
    }

    // The "Search" / "New Search" button is always last.
    // `buttonIndex` starts at 1.
    const isNewSearch = buttonIndex === searchParamsParseResult.data.numButtons;

    const prevKeyword = searchParamsParseResult.data.keyword ?? '';

    const resultIdx = isNewSearch ? 0 : searchParamsParseResult.data.resultIdx ?? 0;

    if (!isNewSearch && (!prevKeyword || resultIdx === 0)) {
        return res.status(400).json({
            statusCode: 400,
            message: 'Bad Request'
        });
    }

    const keyword = (isNewSearch ? inputText : prevKeyword).trim().split(' ')[0].toLowerCase();

    const videos = keyword === '' ? [] : await fetchVideosByKeyword(keyword);

    const video = videos.at(resultIdx);

    if (!video) {
        return noResults({ res, keyword });
    }

    const [match, nextMatch] = [video.linkData, videos.at(resultIdx + 1)?.linkData ?? []].map(
        (linkData) =>
            linkData.find(({ text }) => {
                if (text === null) {
                    return false;
                }

                return text.before.toLowerCase().includes(keyword);
            })
    );

    // TODO: for some reason "Superphiz" resulted in an error even though it is included in one of
    // the link descriptions

    if (!match) {
        return noResults({ res, keyword });
    }

    let episodeTitle = video.title;

    const regex = /The Daily Gwei Refuel #(\d+)/;
    const titleMatch = video.title.match(regex);

    if (titleMatch) {
        episodeTitle = `The Daily Gwei Refuel #${titleMatch[1]}`;
    }

    const imageUrl = await generateImageUrl({
        fontSize: 28,
        fontWeight: 600,
        text: [
            `${episodeTitle} [${format(parseISO(video.publishedAt), 'MMM d, y')}]`,
            match.text === null
                ? match.url
                : `${match.text.before}${match.text.value}${match.text.after}`
        ]
    });

    const buttons: FrameDataButton[] = [
        {
            label: 'Watch',
            action: 'link',
            target: match.url
        },
        ...match.children
            .slice(0, nextMatch ? 1 : 2)
            .map((child, idx, items): { label: string; action: 'link'; target: string } => ({
                label: `Related Link${items.length > 1 ? ` ${idx + 1}` : ''}`,
                action: 'link',
                target: child.url
            })),
        ...(nextMatch
            ? [
                  {
                      label: 'Next Result',
                      action: 'post'
                  } as FrameDataButton
              ]
            : []),
        { label: 'New Search', action: 'post' }
    ];

    const postUrl = new URL(`${BASE_URL}/api/search/frames`);
    const postUrlSearchParams = new URLSearchParams({
        _: Date.now().toString(),
        numButtons: buttons.length.toString()
    });

    if (nextMatch) {
        postUrlSearchParams.set('keyword', keyword);
        postUrlSearchParams.set('resultIdx', (resultIdx + 1).toString());
    }

    postUrl.search = postUrlSearchParams.toString();

    return res
        .setHeader('Content-Type', 'text/html')
        .status(200)
        .send(
            generateHtml({
                title: 'The Daily Gwei Refuel Search',
                imageUrl,
                postUrl: postUrl.toString(),
                buttons,
                isTextInput: true
            })
        );
};

export default handler;
