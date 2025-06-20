// 演示AI搜索功能的脚本
// 这个脚本会在浏览器控制台中运行

async function demoAISearch() {
  console.log('🚀 Starting AI Search Demo...')
  
  // 获取store实例
  const store = window.__ZUSTAND_STORE__
  if (!store) {
    console.error('Store not found. Make sure the app is running.')
    return
  }
  
  const state = store.getState()
  const { actions } = state
  
  // 1. 首先确保AI面板是打开的
  console.log('📌 Opening AI Panel...')
  if (!state.aiPanelVisible) {
    actions.toggleAIPanel()
  }
  
  // 2. 等待索引完成
  console.log('📊 Checking indexing status...')
  if (state.indexingStatus.isIndexing) {
    console.log('⏳ Waiting for indexing to complete...')
    await new Promise(resolve => {
      const checkInterval = setInterval(() => {
        const currentState = store.getState()
        if (!currentState.indexingStatus.isIndexing) {
          clearInterval(checkInterval)
          resolve()
        }
      }, 500)
    })
  }
  
  console.log(`✅ Indexed ${state.indexingStatus.indexedFiles} files`)
  
  // 3. 执行一些示例搜索
  const searchQueries = [
    'function',
    'debounce',
    'export',
    'console.log',
    'import'
  ]
  
  console.log('🔍 Performing searches...')
  
  for (const query of searchQueries) {
    console.log(`\n🔎 Searching for: "${query}"`)
    
    await actions.triggerSearch(query)
    
    // 等待搜索完成
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const results = store.getState().searchResults
    console.log(`📊 Found ${results.length} results`)
    
    if (results.length > 0) {
      console.log('Top 3 results:')
      results.slice(0, 3).forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.chunk.metadata.fileName} (${result.chunk.type}) - ${Math.round(result.score * 100)}% match`)
        console.log(`     Lines ${result.chunk.metadata.startLine}-${result.chunk.metadata.endLine}`)
      })
    }
  }
  
  console.log('\n✨ Demo completed!')
  console.log('💡 Try searching for your own terms in the AI panel!')
}

// 将函数暴露到全局作用域
window.demoAISearch = demoAISearch

// 自动运行演示
console.log('AI Search Demo loaded. Run `demoAISearch()` to start the demo.')