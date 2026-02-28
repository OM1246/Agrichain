let ls = [{
    id: 1,
    name: "Test Both Tractor",
    listingType: "both",
    status: "listed",
    adminStatus: "accepted",
    deleted: false
}];
let currentMarketFilter = 'all';
let listings = ls.filter(l => l.status === 'listed' && !l.deleted && l.adminStatus === 'accepted');

if (currentMarketFilter === 'buy') {
    listings = listings.filter(l => l.listingType === 'buy' || l.listingType === 'both');
} else if (currentMarketFilter === 'rent') {
    listings = listings.filter(l => l.listingType === 'rent' || l.listingType === 'both');
}

console.log('ALL FILTER:', listings.length);

currentMarketFilter = 'buy';
let listingsBuy = ls.filter(l => l.status === 'listed' && !l.deleted && l.adminStatus === 'accepted');
if (currentMarketFilter === 'buy') {
    listingsBuy = listingsBuy.filter(l => l.listingType === 'buy' || l.listingType === 'both');
} else if (currentMarketFilter === 'rent') {
    listingsBuy = listingsBuy.filter(l => l.listingType === 'rent' || l.listingType === 'both');
}
console.log('BUY FILTER:', listingsBuy.length);

