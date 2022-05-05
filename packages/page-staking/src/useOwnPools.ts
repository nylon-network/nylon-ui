// Copyright 2017-2022 @polkadot/app-staking authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Option } from '@polkadot/types';
import type { PalletNominationPoolsPoolMember } from '@polkadot/types/lookup';
import type { OwnPool, OwnPoolBase } from './types';

import { useMemo } from 'react';

import { createNamedHook, useAccounts, useApi, useCall } from '@polkadot/react-hooks';

import { createAccount } from './usePoolAccounts';

const OPT_MULTI = {
  transform: ([[ids], opts]: [[string[]], Option<PalletNominationPoolsPoolMember>[]]): OwnPoolBase[] =>
    ids.reduce((pools: OwnPoolBase[], accountId, index): OwnPoolBase[] => {
      if (opts[index].isSome) {
        const member = opts[index].unwrap();
        let entry = pools.find(({ poolId }) => poolId.eq(member.poolId));

        if (!entry) {
          entry = { members: {}, poolId: member.poolId };

          pools.push(entry);
        }

        entry.members[accountId] = member;
      }

      return pools;
    }, []),
  withParamsTransform: true
};

function useOwnPoolsImpl (): OwnPool[] | undefined {
  const { api } = useApi();
  const { allAccounts } = useAccounts();
  const base = useCall(api.query.nominationPools?.poolMembers.multi, [allAccounts], OPT_MULTI);

  return useMemo(
    () => base && base.map((base) => ({
      ...base,
      rewardId: createAccount(api, base.poolId, 1),
      stashId: createAccount(api, base.poolId, 0)
    })),
    [api, base]
  );
}

export default createNamedHook('useOwnPools', useOwnPoolsImpl);
