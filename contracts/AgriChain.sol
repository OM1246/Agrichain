// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract AgriChain {
    enum Stage { Harvested, InTransit, Stored, AtRetail, Sold }

    struct Product {
        uint256 id;
        string name;
        string description;
        string origin;
        string ipfsHash;
        address currentOwner;
        Stage stage;
        uint256 timestamp;
        string[] history;
        uint256 price;
        bool isForSale;
        string harvestDate; // New field
    }

    uint256 public productCounter;
    mapping(uint256 => Product) public products;

    event ProductRegistered(uint256 indexed id, string name, address indexed owner);
    event StageUpdated(uint256 indexed id, Stage stage, string location);
    event OwnershipTransferred(uint256 indexed id, address indexed from, address indexed to);
    event ProductListed(uint256 indexed id, uint256 price);
    event ProductSold(uint256 indexed id, address indexed newOwner, uint256 price);

    function registerProduct(string memory _name, string memory _description, string memory _origin, string memory _ipfsHash, string memory _harvestDate) public {
        productCounter++;
        uint256 newItemId = productCounter;

        string[] memory initialHistory = new string[](1);
        initialHistory[0] = string(abi.encodePacked("Registered (Harvested on ", _harvestDate, ") by ", toAsciiString(msg.sender), " at ", _origin));

        products[newItemId] = Product({
            id: newItemId,
            name: _name,
            description: _description,
            origin: _origin,
            ipfsHash: _ipfsHash,
            currentOwner: msg.sender,
            stage: Stage.Harvested,
            timestamp: block.timestamp,
            history: initialHistory,
            price: 0,
            isForSale: false,
            harvestDate: _harvestDate
        });

        emit ProductRegistered(newItemId, _name, msg.sender);
    }

    function updateStage(uint256 _id, Stage _newStage, string memory _location) public {
        require(msg.sender == products[_id].currentOwner, "Not owner");
        require(uint(_newStage) > uint(products[_id].stage), "Cannot go backwards");
        
        products[_id].stage = _newStage;
        products[_id].history.push(string(abi.encodePacked("Stage updated to ", getStageName(_newStage), " at ", _location)));
        
        emit StageUpdated(_id, _newStage, _location);
    }

    // List product for sale
    function listForSale(uint256 _id, uint256 _price) public {
        require(msg.sender == products[_id].currentOwner, "Not owner");
        require(_price > 0, "Price must be > 0");

        products[_id].price = _price;
        products[_id].isForSale = true;
        
        products[_id].history.push(string(abi.encodePacked("Listed for sale at ", uint2str(_price), " wei")));
        
        emit ProductListed(_id, _price);
    }

    // Buy product
    function buyProduct(uint256 _id) public payable {
        Product storage product = products[_id];
        require(product.isForSale, "Not for sale");
        require(msg.value >= product.price, "Insufficient funds");
        require(msg.sender != product.currentOwner, "Owner cannot buy");

        address oldOwner = product.currentOwner;
        address newOwner = msg.sender;
        uint256 price = product.price;

        // Transfer ownership
        product.currentOwner = newOwner;
        product.isForSale = false;
        product.price = 0;
        
        product.history.push(string(abi.encodePacked("Purchased by ", toAsciiString(newOwner), " for ", uint2str(price), " wei")));

        // Pay old owner
        (bool sent, ) = payable(oldOwner).call{value: price}("");
        require(sent, "Failed to send Ether");

        emit ProductSold(_id, newOwner, price);
        emit OwnershipTransferred(_id, oldOwner, newOwner);
    }

    function transferOwnership(uint256 _id, address _newOwner) public {
        require(msg.sender == products[_id].currentOwner, "Not owner");
        address oldOwner = products[_id].currentOwner;
        
        products[_id].currentOwner = _newOwner;
        products[_id].isForSale = false; // Delist if transferred manually
        products[_id].history.push(string(abi.encodePacked("Ownership transferred to ", toAsciiString(_newOwner))));

        emit OwnershipTransferred(_id, oldOwner, _newOwner);
    }

    function getProduct(uint256 _id) public view returns (Product memory) {
        return products[_id];
    }

    function getProductHistory(uint256 _id) public view returns (string[] memory) {
        return products[_id].history;
    }

    // Helper: Convert address to string
    function toAsciiString(address x) internal pure returns (string memory) {
        bytes memory s = new bytes(40);
        for (uint i = 0; i < 20; i++) {
            bytes1 b = bytes1(uint8(uint(uint160(x)) / (2**(8*(19 - i)))));
            bytes1 hi = bytes1(uint8(b) / 16);
            bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
            s[2*i] = char(hi);
            s[2*i+1] = char(lo);            
        }
        return string(s);
    }

    function char(bytes1 b) internal pure returns (bytes1 c) {
        if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
        else return bytes1(uint8(b) + 0x57);
    }

    function getStageName(Stage _stage) internal pure returns (string memory) {
        if (_stage == Stage.Harvested) return "Harvested";
        if (_stage == Stage.InTransit) return "In Transit";
        if (_stage == Stage.Stored) return "Stored";
        if (_stage == Stage.AtRetail) return "At Retail";
        if (_stage == Stage.Sold) return "Sold";
        return "Unknown";
    }

    function uint2str(uint _i) internal pure returns (string memory _uintAsString) {
        if (_i == 0) {
            return "0";
        }
        uint j = _i;
        uint len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint k = len;
        while (_i != 0) {
            k = k-1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }
}
