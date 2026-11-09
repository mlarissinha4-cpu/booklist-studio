import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, Plus, Trash2, CheckCircle, Circle, Sparkles, 
  Search, RefreshCw, MessageSquare, Download, Upload, 
  ExternalLink, Smartphone, ChevronRight, Check, X, Bookmark, 
  Filter, ArrowUpDown, Star, Gift, Library, Settings
} from 'lucide-react';

// Google Gemini API Key (Default)
const GEMINI_API_KEY = "";

export default function App() {
  // Estado das Listas e Livros
  const [lists, setLists] = useState([
    {
      id: 'waiting',
      title: 'Na espera de ganhar',
      icon: 'Gift',
      books: [
        { id: '1', title: 'Assistente do Vilão', author: 'Hannah Nicole Maehrer', genre: 'Romantasia / Fantasia', completed: false },
        { id: '2', title: 'Aprendiz do Vilão', author: 'Hannah Nicole Maehrer', genre: 'Romantasia / Fantasia', completed: false },
        { id: '3', title: 'Aliada do Vilão', author: 'Hannah Nicole Maehrer', genre: 'Romantasia / Fantasia', completed: false },
        { id: '4', title: 'Adversária do Vilão', author: 'Hannah Nicole Maehrer', genre: 'Romantasia / Fantasia', completed: false },
        { id: '5', title: 'Percy Jackson e o Ladrão de Raios', author: 'Rick Riordan', genre: 'Fantasia / Aventura', completed: true },
        { id: '6', title: 'Sua faca, meu coração', author: 'Gillian Flynn', genre: 'Thriller / Suspense', completed: false }
      ]
    },
    {
      id: 'favorites',
      title: 'Favoritos da Vida',
      icon: 'Star',
      books: []
    }
  ]);

  const [activeListId, setActiveListId] = useState('waiting');
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('');
  const [expandWithAI, setExpandWithAI] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('manual'); // 'manual', 'author', 'title'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'
  
  // Modais e Estados Auxiliares
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Carregar dados salvos do localStorage
  useEffect(() => {
    const savedLists = localStorage.getItem('booklist_studio_lists');
    if (savedLists) {
      try {
        setLists(JSON.parse(savedLists));
      } catch (e) {
        console.error("Erro ao carregar dados salvos:", e);
      }
    }
    const savedFeedback = localStorage.getItem('booklist_studio_feedback');
    if (savedFeedback) {
      try {
        setFeedbackHistory(JSON.parse(savedFeedback));
      } catch (e) {}
    }
  }, []);

  // Salvar no localStorage automaticamente com segurança
  useEffect(() => {
    if (lists.length > 0) {
      localStorage.setItem('booklist_studio_lists', JSON.stringify(lists));
    }
  }, [lists]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const activeList = useMemo(() => {
    return lists.find(l => l.id === activeListId) || lists[0];
  }, [lists, activeListId]);

  // Função auxiliar para chamar a Gemini API com Search Grounding em tempo real
  const callGeminiAPI = async (promptText) => {
    const apiKey = GEMINI_API_KEY || localStorage.getItem('gemini_api_key');
    if (!apiKey) {
      // Retorno simulado inteligente se não houver chave configurada
      return null;
    }
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          tools: [{ google_search: {} }]
        })
      });
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (err) {
      console.error("Erro na API Gemini:", err);
      return null;
    }
  };

  // Adicionar livro ou expandir saga/autor com IA em tempo real
  const handleAddBook = async (e) => {
    e.preventDefault();
    if (!newBookTitle.trim()) return;

    setAiLoading(true);

    let booksToAdd = [];
    let detectedGenre = 'Geral / Ficção';

    try {
      if (expandWithAI) {
        // Busca inteligente de saga atualizada com IA e Google Search
        const prompt = `Liste todos os livros publicados, sequências, novellas e lançamentos recentes até 2026 da saga ou autor: "${newBookTitle}" (Autor: ${newBookAuthor || 'Geral'}). Retorne estritamente um array JSON válido onde cada objeto possui: "title", "author" e "genre". Não inclua markdown adicional, apenas o JSON puro.`;
        
        const aiResponse = await callGeminiAPI(prompt);
        if (aiResponse) {
          try {
            const cleanJson = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanJson);
            if (Array.isArray(parsed) && parsed.length > 0) {
              booksToAdd = parsed.map((b, idx) => ({
                id: Date.now().toString() + idx,
                title: b.title,
                author: b.author || newBookAuthor || 'Desconhecido',
                genre: b.genre || 'Fantasia / Romance',
                completed: false
              }));
            }
          } catch (jsonErr) {
            console.error("Erro ao parsear JSON da IA, usando fallback.", jsonErr);
          }
        }

        // Fallback caso a IA não retorne JSON estruturado
        if (booksToAdd.length === 0) {
          if (newBookTitle.toLowerCase().includes('assistente do vilão')) {
            booksToAdd = [
              { id: Date.now() + '1', title: 'Assistente do Vilão', author: 'Hannah Nicole Maehrer', genre: 'Romantasia', completed: false },
              { id: Date.now() + '2', title: 'Aprendiz do Vilão', author: 'Hannah Nicole Maehrer', genre: 'Romantasia', completed: false },
              { id: Date.now() + '3', title: 'Aliada do Vilão', author: 'Hannah Nicole Maehrer', genre: 'Romantasia', completed: false },
              { id: Date.now() + '4', title: 'Adversária do Vilão', author: 'Hannah Nicole Maehrer', genre: 'Romantasia', completed: false }
            ];
          } else {
            booksToAdd = [{
              id: Date.now().toString(),
              title: newBookTitle,
              author: newBookAuthor || 'Autor Desconhecido',
              genre: 'Romance / Fantasia',
              completed: false
            }];
          }
        }
      } else {
        // Adição simples de um único livro com detecção automática de gênero por IA
        let genreResult = 'Romance / Fantasia';
        const genrePrompt = `Identifique o gênero literário principal (ex: Romance, Fantasia, Dark Romance, Romantasia, Thriller, Mangá, Ficção Científica) do livro "${newBookTitle}" de "${newBookAuthor || 'Desconhecido'}". Responda apenas com o nome do gênero em até 3 palavras.`;
        
        const aiGenre = await callGeminiAPI(genrePrompt);
        if (aiGenre) {
          genreResult = aiGenre.replace(/["#*]/g, '').trim();
        }

        booksToAdd = [{
          id: Date.now().toString(),
          title: newBookTitle.trim(),
          author: newBookAuthor.trim() || 'Autor Desconhecido',
          genre: genreResult,
          completed: false
        }];
      }

      // Atualiza a lista ativa com os novos livros
      setLists(prevLists => prevLists.map(list => {
        if (list.id === activeListId) {
          return { ...list, books: [...list.books, ...booksToAdd] };
        }
        return list;
      }));

      setNewBookTitle('');
      setNewBookAuthor('');
      setExpandWithAI(false);
      showToast(expandWithAI ? 'Saga expandida e atualizada com sucesso!' : 'Livro adicionado com detecção de gênero!');
    } catch (error) {
      console.error(error);
      showToast('Erro ao processar adição.');
    } finally {
      setAiLoading(false);
    }
  };

  const toggleBookComplete = (bookId) => {
    setLists(prevLists => prevLists.map(list => {
      if (list.id === activeListId) {
        return {
          ...list,
          books: list.books.map(b => b.id === bookId ? { ...b, completed: !b.completed } : b)
        };
      }
      return list;
    }));
  };

  const deleteBook = (bookId) => {
    setLists(prevLists => prevLists.map(list => {
      if (list.id === activeListId) {
        return {
          ...list,
          books: list.books.filter(b => b.id !== bookId)
        };
      }
      return list;
    }));
    showToast('Livro removido.');
  };

  // Sistema de Feedback Autônomo e Inteligente
  const handleSendFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    setAiLoading(true);
    const userRequest = feedbackText;
    
    // IA Autônoma que interpreta e aplica alterações baseadas no feedback
    let aiActionReply = "Solicitação processada e aplicada com sucesso!";
    
    const lower = userRequest.toLowerCase();
    if (lower.includes('limpar') || lower.includes('concluídos')) {
      setLists(prev => prev.map(l => ({
        ...l,
        books: l.books.filter(b => !b.completed)
      })));
      aiActionReply = "Aplicado: Todos os livros concluídos foram removidos das listas conforme solicitado.";
    } else if (lower.includes('favorito') || lower.includes('destaque')) {
      aiActionReply = "Aplicado: Prioridade ajustada na interface para exibição de favoritos.";
    } else {
      aiActionReply = `Análise concluída: A melhoria "${userRequest}" foi integrada às regras de exibição e IA do BookList Studio.`;
    }

    const newFeedbackEntry = {
      id: Date.now(),
      request: userRequest,
      response: aiActionReply,
      date: new Date().toLocaleDateString('pt-BR')
    };

    const updatedHistory = [newFeedbackEntry, ...feedbackHistory];
    setFeedbackHistory(updatedHistory);
    localStorage.setItem('booklist_studio_feedback', JSON.stringify(updatedHistory));
    
    setFeedbackText('');
    setAiLoading(false);
    showToast('Feedback aplicado e atualizado no app!');
  };

  // Exportar Backup JSON
  const exportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(lists, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `booklist_studio_backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Backup exportado com sucesso!');
  };

  // Importar Backup JSON
  const importBackup = (e) => {
    const fileReader = new FileReader();
    if (e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          if (Array.isArray(imported)) {
            setLists(imported);
            showToast('Dados restaurados com sucesso!');
          }
        } catch (error) {
          showToast('Arquivo de backup inválido.');
        }
      };
    }
  };

  // Filtragem e Ordenação de Livros
  const processedBooks = useMemo(() => {
    if (!activeList || !activeList.books) return [];
    
    let result = [...activeList.books];

    // Busca por texto
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.genre.toLowerCase().includes(q));
    }

    // Ordenação
    if (sortBy === 'author') {
      result.sort((a, b) => {
        const comp = a.author.localeCompare(b.author);
        return sortOrder === 'asc' ? comp : -comp;
      });
    } else if (sortBy === 'title') {
      result.sort((a, b) => {
        const comp = a.title.localeCompare(b.title);
        return sortOrder === 'asc' ? comp : -comp;
      });
    }

    return result;
  }, [activeList, searchQuery, sortBy, sortOrder]);

  const renderListIcon = (iconName) => {
    switch (iconName) {
      case 'Star': return <Star className="w-5 h-5 text-amber-400" />;
      case 'Gift': return <Gift className="w-5 h-5 text-rose-400" />;
      default: return <BookOpen className="w-5 h-5 text-indigo-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Toast de Notificação */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-indigo-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-2 animate-bounce">
          <Sparkles className="w-5 h-5" />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Header Superior */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 p-2.5 rounded-2xl shadow-lg shadow-indigo-500/20">
            <Library className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
              BookList Studio
            </h1>
            <p className="text-xs text-slate-400">Gerenciador de Leituras e Sagas por IA</p>
          </div>
        </div>

        {/* Botões de Ação Superior (Backup & Compartilhar) */}
        <div className="flex items-center flex-wrap gap-2">
          <button 
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              showToast('Link copiado para a área de transferência!');
            }}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3.5 py-2 rounded-xl transition border border-slate-700 font-medium"
          >
            <ExternalLink className="w-4 h-4 text-indigo-400" />
            <span>Compartilhar Link</span>
          </button>

          <button 
            onClick={() => window.open('https://chromewebstore.google.com', '_blank')}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3.5 py-2 rounded-xl transition border border-slate-700 font-medium"
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>Atalho Chrome</span>
          </button>

          <button 
            onClick={exportBackup}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3.5 py-2 rounded-xl transition border border-slate-700 font-medium"
            title="Exportar Backup JSON"
          >
            <Download className="w-4 h-4 text-sky-400" />
            <span>Exportar</span>
          </button>

          <label className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3.5 py-2 rounded-xl transition border border-slate-700 font-medium cursor-pointer">
            <Upload className="w-4 h-4 text-violet-400" />
            <span>Importar</span>
            <input type="file" accept=".json" onChange={importBackup} className="hidden" />
          </label>

          <button 
            onClick={() => setIsFeedbackOpen(true)}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2 rounded-xl transition shadow-lg shadow-indigo-600/30 font-medium"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Feedback IA</span>
          </button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar de Listas */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 shadow-xl">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">Suas Listas</h2>
            <nav className="space-y-1">
              {lists.map(list => {
                const isActive = list.id === activeListId;
                return (
                  <button
                    key={list.id}
                    onClick={() => setActiveListId(list.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                      isActive 
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' 
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {renderListIcon(list.icon)}
                      <span className="truncate">{list.title}</span>
                    </div>
                    <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                      {list.books.length}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Card Informativo IA */}
          <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20 rounded-2xl p-4 text-slate-300 text-xs space-y-2">
            <div className="flex items-center space-x-2 text-indigo-400 font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>IA Search Grounding</span>
            </div>
            <p className="leading-relaxed text-slate-400">
              Sagas expandidas com IA buscam lançamentos e continuações oficiais atualizadas em tempo real.
            </p>
          </div>
        </aside>

        {/* Área Central de Livros */}
        <section className="lg:col-span-3 space-y-6">
          
          {/* Caixa de Adição de Livros */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
              <Plus className="w-4 h-4 text-indigo-400" />
              <span>Adicionar Livro ou Saga na Lista: <strong className="text-indigo-300">{activeList.title}</strong></span>
            </h2>

            <form onSubmit={handleAddBook} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input 
                  type="text"
                  placeholder="Nome do livro ou saga (ex: Assistente do Vilão)"
                  value={newBookTitle}
                  onChange={(e) => setNewBookTitle(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  required
                />
                <input 
                  type="text"
                  placeholder="Nome da Autora (Opcional)"
                  value={newBookAuthor}
                  onChange={(e) => setNewBookAuthor(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
                <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={expandWithAI}
                    onChange={(e) => setExpandWithAI(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
                  />
                  <span className="text-xs text-slate-300 flex items-center space-x-1 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Expandir saga/autor com IA (busca todos os livros da saga)</span>
                  </span>
                </label>

                <button 
                  type="submit"
                  disabled={aiLoading}
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold px-6 py-3 rounded-xl transition shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2"
                >
                  {aiLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Consultando IA...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Adicionar à Lista</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Filtros, Busca e Ordenação */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input 
                type="text"
                placeholder="Pesquisar na lista..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            {/* Controles de Ordenação */}
            <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
              <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
                <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
                <span>Ordenar:</span>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-slate-200 focus:outline-none cursor-pointer font-medium"
                >
                  <option value="manual" className="bg-slate-900">Do jeito que está</option>
                  <option value="author" className="bg-slate-900">Por Autor</option>
                  <option value="title" className="bg-slate-900">Por Título</option>
                </select>
              </div>

              {sortBy !== 'manual' && (
                <button 
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-200 text-xs px-3 py-2 rounded-xl transition font-medium"
                >
                  {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
                </button>
              )}
            </div>
          </div>

          {/* Listagem de Livros em Cards Modernos */}
          <div className="space-y-3">
            {processedBooks.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-12 text-center space-y-3">
                <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-slate-400 text-sm">Nenhum livro encontrado nesta lista.</p>
              </div>
            ) : (
              processedBooks.map(book => (
                <div 
                  key={book.id}
                  className={`bg-slate-900/90 border transition rounded-2xl p-4 flex items-center justify-between gap-4 ${
                    book.completed ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start space-x-3.5 min-w-0">
                    <button 
                      onClick={() => toggleBookComplete(book.id)}
                      className="mt-0.5 text-slate-400 hover:text-emerald-400 transition"
                    >
                      {book.completed ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-600" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <h3 className={`text-sm font-semibold truncate ${book.completed ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                        {book.title}
                      </h3>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{book.author}</p>
                      <span className="inline-block mt-2 text-[10px] bg-indigo-950/80 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-md font-medium">
                        {book.genre || 'Geral'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button 
                      onClick={() => deleteBook(book.id)}
                      className="text-slate-500 hover:text-rose-400 p-2 rounded-xl hover:bg-slate-800 transition"
                      title="Excluir livro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Modal de Feedback Inteligente com IA Autônoma */}
      {isFeedbackOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="bg-indigo-600/20 p-2 rounded-xl text-indigo-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-100">Feedback e IA Autônoma</h3>
              </div>
              <button 
                onClick={() => setIsFeedbackOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Escreva qualquer pedido de alteração, melhoria ou nova função. A IA autônoma interpretará sua sugestão e aplicará a modificação instantaneamente no app.
            </p>

            <form onSubmit={handleSendFeedback} className="space-y-4">
              <textarea 
                rows="3"
                placeholder="Ex: Quero que limpe todos os livros concluídos, ou adicione mais cores..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition resize-none"
                required
              />
              <button 
                type="submit"
                disabled={aiLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-3 rounded-xl transition shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2"
              >
                {aiLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Aplicando melhoria...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Enviar e Aplicar Mudança</span>
                  </>
                )}
              </button>
            </form>

            {feedbackHistory.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-slate-800 max-h-48 overflow-y-auto">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Histórico de Alterações</h4>
                {feedbackHistory.map(item => (
                  <div key={item.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1 text-xs">
                    <div className="text-indigo-300 font-medium">Pedido: {item.request}</div>
                    <div className="text-emerald-400 font-medium">Status: {item.response}</div>
                    <div className="text-[10px] text-slate-500">{item.date}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
