pragma solidity >=0.8.0;

contract Folders {
  uint folderSize;

  mapping(uint => Folder) public folders;
  
  constructor(){
    folderSize = 0;
  }

  struct Folder{
    uint folderId;
    string name;
  }

  function makeNewFolder(string memory _name) public{
      folderSize += 1;
      uint id = folderSize;
      folders[id] = Folder(id,_name);

  }

  function getTotalFolder() public view returns(uint){
    return folderSize;
  }
}