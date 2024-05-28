import { getRequestLoadFee } from '~/stores/helpers'

export const calculateLoadFee = async (data, containers) => {
  const { processingFee } = await getRequestLoadFee()
  const marketplaceFeePercentage = parseFloat(
    ((data.amountBreakup.baseFee * 100) / (data.committed * data.estimatedRate)).toFixed(2),
  )

  const truckerRevenue = data.estimatedRate * containers

  const marketPlaceFee = parseFloat(((truckerRevenue / 100) * marketplaceFeePercentage).toFixed(2))

  const stripeCharge = (marketPlaceFee / 100) * processingFee.percentage
  const finalFee = stripeCharge + processingFee.cents / 100
  const processingFeeAmount = parseFloat(finalFee.toFixed(2))

  const loadFee = parseFloat(processingFeeAmount + marketPlaceFee).toFixed(2)
  const amountBreakup = {
    baseFee: marketPlaceFee,
    processingFee: parseFloat(processingFeeAmount.toFixed(2)),
  }
  return {
    loadFee: loadFee,
    amountBreakup: amountBreakup,
  }
}
