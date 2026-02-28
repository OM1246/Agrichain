const fs = require('fs');
// Mock listing
const listings = [{
    id: Date.now(),
    name: "Test Both Tractor",
    desc: "A test tractor",
    age: "1 year",
    listingType: "both",
    buyPrice: 1000,
    rentPrice: 100,
    image: "",
    status: "listed",
    adminStatus: "accepted",
    revenue: 0,
    listedAt: new Date().toISOString(),
    deleted: false
}];
console.log("Mock listing created.");
