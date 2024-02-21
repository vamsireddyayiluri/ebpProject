import { useCommitmentsStore } from '~/stores/commitments.store'

const { getCommitment } = useCommitmentsStore()

export const handleQueryUrlForCommitments = useDebounceFn(async queries => {
  const { bid, cid } = queries

  if (bid && cid) {
    const commitment = await getCommitment(cid)

    return commitment
  }
}, 500)
