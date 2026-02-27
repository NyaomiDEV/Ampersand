#!/bin/sh

# build
xcodebuild \
	-project src-tauri/gen/apple/ampersand.xcodeproj \
	-scheme ampersand_iOS \
	-configuration Release \
	-sdk iphoneos \
	archive \
	-archivePath $PWD/build.xcarchive \
	CODE_SIGNING_ALLOWED=NO

# make ipa
mkdir build.xcarchive/Products/Applications/Payload
cp -R build.xcarchive/Products/Applications/Ampersand.app build.xcarchive/Products/Applications/Payload/
_pwd=$PWD
cd build.xcarchive/Products/Applications/
zip -r9 $_pwd/Ampersand.ipa Payload
cd $_pwd
rm -r build.xcarchive