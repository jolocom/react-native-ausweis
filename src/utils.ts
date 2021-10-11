export const delay = async (delay: number) => {
  return new Promise((resolve) => setTimeout(resolve, delay))
}
