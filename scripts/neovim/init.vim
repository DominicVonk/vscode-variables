set nocompatible
set runtimepath^=/sandbox/coc.nvim
set runtimepath^=/sandbox/extension
let g:coc_config_home = '/sandbox/config'
let g:coc_data_home = '/sandbox/data'
let g:coc_disable_startup_warning = 1
cd /sandbox/workspace
edit /sandbox/workspace/folder/file.test.ts
function! RunSandbox(timer)
  if get(g:, 'coc_service_initialized', 0)
    call timer_stop(a:timer)
    call CocActionAsync('runCommand', 'sandbox.test')
  endif
endfunction
call timer_start(100, function('RunSandbox'), {'repeat': -1})
