#!/bin/sh
project_dir=$PWD
echo "Notice: updating AusweisApp2 git module"
path="ios/Frameworks/AusweisApp2-SDK-iOS"
url="https://github.com/Governikus/AusweisApp2-SDK-iOS"
if [[ -d "${path}/.git" ]]; then
  echo "Notice: git pull submodule $(realpath ${path})"
  cd "${path}" && git pull
else if [[ -z "$(ls -A ${path})" ]]; then
  echo "Notice: git clone submodule $(realpath ${path})"
  rm -rf "${path}"
  git clone --depth 1 $url $path
else echo "Notice: $(realpath ${path}) submodule folder is not empty, try to remove it before clone."; fi; fi
cd "${project_dir}"
