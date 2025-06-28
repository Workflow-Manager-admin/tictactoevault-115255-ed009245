#!/bin/bash
cd /home/kavia/workspace/code-generation/tictactoevault-115255-ed009245/tic_tac_toe_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

