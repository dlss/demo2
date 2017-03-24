# init env
	'npm run initPr' or 'npm run initGu'

# run command
  ## run with protractor ('npm run startDr' is pre step)
	protractor protractor.config.js
	protractor protractor.config.js --suite demo
  
  ## run with script 'runPr' ('npm run startDr' is pre step)
	npm run runPr
	npm run runPr -- --suite demo

  ## run with gulp ('gulp' is pre step)
	gulp e2e --suite demo


# todo
  

