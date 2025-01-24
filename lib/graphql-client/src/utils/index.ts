// Helper function to format channel ID into string identifier that BigCommerce GraphQL API expects
export function formatChannelId(channelId: string | number): string {
return typeof channelId === "string" &&
    channelId.includes("bc/store/channel/")
    ? channelId
    : `bc/store/channel/${channelId}`;
}

// Helper function to format product ID into string identifier that BigCommerce GraphQL API expects
export function formatProductId(productId: string | number): string {
return typeof productId === "string" &&
    productId.includes("bc/store/product/")
    ? productId
    : `bc/store/product/${productId}`;
}
