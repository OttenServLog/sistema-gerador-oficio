import React, { useState, useEffect, useRef } from 'react';
import {
  TextField, Button, Select, MenuItem, InputLabel, FormControl,
  Box, Typography, Grid, Paper, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, CircularProgress, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Tooltip
} from '@mui/material';
import {
  Edit, Delete, UploadFile, ManageAccounts, PictureAsPdf
} from '@mui/icons-material';
import axios from 'axios';

function App() {
  const [file, setFile] = useState(null);
  const [contaTemp, setContaTemp] = useState('');
  const [contaDialogAberto, setContaDialogAberto] = useState(false);
  const fornecedoresTemp = useRef([]);
  const alertaFonteTemp = useRef(false);
  const [dialogSuperavit, setDialogSuperavit] = useState(false);
  const [tabelas, setTabelas] = useState([]);

  const [numeroOficio, setNumeroOficio] = useState('');
  const [assinatura1, setAssinatura1] = useState('');
  const [assinatura2, setAssinatura2] = useState('');
  const [open, setOpen] = useState(false);
  const [newAssinatura, setNewAssinatura] = useState({ nome: '', cargo: '', decreto: '' });
  const [assinaturas, setAssinaturas] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedAssinaturas = JSON.parse(localStorage.getItem('assinaturas'));
    if (savedAssinaturas?.length > 0) {
      setAssinaturas(savedAssinaturas);
      setAssinatura1(savedAssinaturas[0]?.nome || '');
      setAssinatura2(savedAssinaturas[1]?.nome || '');
    } else {
      const defaultAssinaturas = [
        { nome: "VALDILENE ROCHA COSTA ALVES", cargo: "SECRETÁRIA DE SAÚDE", decreto: "017/2025" },
        { nome: "DIÊNIFER CERETTA PIMENTA MOTA", cargo: "Diretora Executiva da Secretaria Municipal da Saúde", decreto: "Decreto nº 0046/2025" },
        { nome: "EUNICE CRISTINA PERES SIMÕES", cargo: "Secretária Adjunta de Saúde", decreto: "Decreto nº 017/2025 – Portaria PMU/SMS nº 018/2025" }
      ];
      setAssinaturas(defaultAssinaturas);
      setAssinatura1(defaultAssinaturas[0].nome);
      setAssinatura2(defaultAssinaturas[1].nome);
    }
  }, []);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const removerZerosEsquerda = (conta) => {
    const match = conta.match(/0*(\d+)-(\d)/);
    return match ? `${match[1]}-${match[2]}` : conta;
  };

  const handleUpload = async () => {
    if (!file || !numeroOficio || !assinatura1 || !assinatura2) {
      alert('Preencha o Número do Ofício, selecione as Assinaturas e anexe o PDF.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    try {
      const response = await axios.post('https://sistema-gerador-oficio.onrender.com/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const conta = removerZerosEsquerda(response.data.conta_debito || '');
      setContaTemp(conta);
      fornecedoresTemp.current = response.data.fornecedores || [];
      alertaFonteTemp.current = response.data.fonte_alerta || false;
      setContaDialogAberto(true);
    } catch (error) {
      console.error('Erro ao enviar o arquivo:', error);
      alert('Erro ao processar o PDF.');
    }
    setLoading(false);
  };
  const confirmarConta = () => {
    const conta = contaTemp;
    setTabelas((prev) => {
      const existente = prev.find(t => t.conta === conta);
      if (existente) {
        return prev.map(t =>
          t.conta === conta
            ? { ...t, fornecedores: [...t.fornecedores, ...fornecedoresTemp.current] }
            : t
        );
      } else {
        return [...prev, { conta, fornecedores: fornecedoresTemp.current }];
      }
    });
    setContaDialogAberto(false);
    if (alertaFonteTemp.current) {
      setDialogSuperavit(true);
    }
  };

  const cancelarConta = () => {
    setContaTemp('');
    fornecedoresTemp.current = [];
    setContaDialogAberto(false);
  };

  const handleGenerateOficio = async () => {
    const todos = tabelas.flatMap(t => t.fornecedores);
    if (tabelas.length === 0 || todos.length === 0) {
      alert('Você precisa processar pelo menos um PDF com fornecedores.');
      return;
    }

    try {
      const response = await axios.post('https://sistema-gerador-oficio.onrender.com/gerar-oficio', {
        numeroOficio, assinatura1, assinatura2, tabelas, assinaturas 
      }, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `OFICIO ${numeroOficio} - AUTORIZAÇÃO DE PAGAMENTO.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erro ao gerar ofício:', error);
      alert('Erro ao gerar ofício.');
    }
  };
  return (
    <Box sx={{ width: '100%', minHeight: '100vh', background: 'linear-gradient(135deg, #d3d3d3, #a9a9a9)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: 4 }}>
      <Paper sx={{ width: '900px', padding: 4, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.95)', boxShadow: 6 }}>
        <Typography variant="h4" align="center" sx={{ fontWeight: 600, color: '#1976d2', marginBottom: 3 }}>
          Gerador de Ofício
        </Typography>

        <Button variant="contained" startIcon={<ManageAccounts />} onClick={() => setOpen(true)} sx={{ backgroundColor: '#1976d2', mb: 4, mx: 'auto', display: 'block' }}>
          Gerenciar Assinaturas
        </Button>

        <Grid container spacing={2} sx={{ marginBottom: 2 }}>
          <Grid item xs={12}>
            <TextField label="Número do Ofício" variant="outlined" fullWidth value={numeroOficio} onChange={(e) => setNumeroOficio(e.target.value)} />
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Assinatura 1</InputLabel>
              <Select value={assinatura1} label="Assinatura 1" onChange={(e) => setAssinatura1(e.target.value)}>
                {assinaturas.map((a, i) => (
                  <MenuItem key={i} value={a.nome}>{a.nome} - {a.cargo}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Assinatura 2</InputLabel>
              <Select value={assinatura2} label="Assinatura 2" onChange={(e) => setAssinatura2(e.target.value)}>
                {assinaturas.map((a, i) => (
                  <MenuItem key={i} value={a.nome}>{a.nome} - {a.cargo}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Button variant="contained" component="label" fullWidth startIcon={<UploadFile />} sx={{ backgroundColor: '#1976d2' }}>
              Anexar Autorização de Pagamento
              <input type="file" hidden onChange={handleFileChange} />
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" fullWidth onClick={handleUpload} sx={{ backgroundColor: '#1976d2' }}>
              {loading ? <CircularProgress size={24} color="inherit" /> : "Processar PDF"}
            </Button>
          </Grid>
        </Grid>

        {tabelas.map((t, idx) => (
          <Grid item xs={12} key={idx} sx={{ mt: 4 }}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ fontWeight: 'bold' }}>
                      CONTA DO DÉBITO: {t.conta}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Favorecido</TableCell>
                    <TableCell>CNPJ/CPF</TableCell>
                    <TableCell>Conta para Crédito</TableCell>
                    <TableCell>Valor</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {t.fornecedores.map((f, i) => {
                    const fonteLimpa = f.fonte?.toString().replace(/\D/g, '');
                    const isSuperavit = fonteLimpa?.startsWith('2');
                    const hasDesconto = f.desconto && f.desconto !== '0,00';

                    const bgColor = isSuperavit && hasDesconto
                      ? '#f3e5f5' // roxo claro
                      : isSuperavit
                      ? '#fffde7' // amarelo claro
                      : hasDesconto
                      ? '#e3f2fd' // azul claro
                      : 'inherit';

                    const tooltip = isSuperavit && hasDesconto
                      ? 'Superávit e Desconto - Fazer ambos os lançamentos contábeis'
                      : isSuperavit
                      ? 'Pagamento de Superávit - Fazer lançamento'
                      : hasDesconto
                      ? 'Desconto - Fazer transferência no sistema contábil'
                      : '';

                    const row = (
                      <TableRow key={i} sx={{ backgroundColor: bgColor }}>
                        <TableCell>{f.nome}</TableCell>
                        <TableCell>{f.cnpj}</TableCell>
                        <TableCell>
                          Banco: {f.banco}<br />
                          Agência: {f.agencia}<br />
                          Conta: {f.conta}
                        </TableCell>
                        <TableCell>R$ {f.valorLiquido}</TableCell>
                      </TableRow>
                    );

                    return tooltip ? <Tooltip title={tooltip} arrow>{row}</Tooltip> : row;
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        ))}

        {tabelas.length > 0 && (
          <Grid item xs={12} sx={{ mt: 3 }}>
            <Button variant="contained" fullWidth startIcon={<PictureAsPdf />} onClick={handleGenerateOficio} sx={{ backgroundColor: '#43a047' }}>
              Gerar Ofício
            </Button>
          </Grid>
        )}

        <Dialog open={contaDialogAberto} onClose={cancelarConta}>
          <DialogTitle>Conta de Débito encontrada</DialogTitle>
          <DialogContent>
            <Typography sx={{ mb: 1 }}>Favor conferir na nota de liquidação e confirmar:</Typography>
            <TextField label="Conta de Débito" fullWidth value={contaTemp} onChange={(e) => setContaTemp(e.target.value)} autoFocus />
          </DialogContent>
          <DialogActions>
            <Button onClick={cancelarConta} color="error">Cancelar</Button>
            <Button onClick={confirmarConta} variant="contained" color="primary">Confirmar</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={dialogSuperavit} onClose={() => setDialogSuperavit(false)}>
          <DialogTitle>Atenção</DialogTitle>
          <DialogContent>
            <Typography>
              Pagamento com superávit detectado. Favor fazer o lançamento no sistema contábil.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogSuperavit(false)} variant="contained">Entendido</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={open} onClose={() => setOpen(false)}>
          <DialogTitle>Gerenciar Assinaturas</DialogTitle>
          <DialogContent>
            <Grid container direction="column" spacing={2}>
              <Grid item>
                <TextField label="Nome" fullWidth value={newAssinatura.nome} onChange={(e) => setNewAssinatura({ ...newAssinatura, nome: e.target.value })} sx={{ mb: 2 }} />
                <TextField label="Cargo" fullWidth value={newAssinatura.cargo} onChange={(e) => setNewAssinatura({ ...newAssinatura, cargo: e.target.value })} sx={{ mb: 2 }} />
                <TextField label="Decreto" fullWidth value={newAssinatura.decreto} onChange={(e) => setNewAssinatura({ ...newAssinatura, decreto: e.target.value })} sx={{ mb: 2 }} />
              </Grid>
              {assinaturas.map((a, i) => (
                <Grid item key={i} container alignItems="center" justifyContent="space-between">
                  <Typography sx={{ maxWidth: '70%' }}>{a.nome} - {a.cargo}</Typography>
                  <Box>
                    <IconButton onClick={() => {
                      setNewAssinatura(a);
                      setEditingIndex(i);
                      setOpen(true);
                    }} color="primary" sx={{ mr: 1 }}><Edit /></IconButton>
                    <IconButton onClick={() => {
                      const atualizadas = assinaturas.filter((_, idx) => idx !== i);
                      setAssinaturas(atualizadas);
                      localStorage.setItem('assinaturas', JSON.stringify(atualizadas));
                    }} color="error"><Delete /></IconButton>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => {
              if (!newAssinatura.nome || !newAssinatura.cargo || !newAssinatura.decreto) {
                alert('Preencha todos os campos da assinatura.');
                return;
              }

              const atualizadas = editingIndex !== null
                ? assinaturas.map((a, i) => i === editingIndex ? newAssinatura : a)
                : [...assinaturas, newAssinatura];

              setAssinaturas(atualizadas);
              localStorage.setItem('assinaturas', JSON.stringify(atualizadas));
              setNewAssinatura({ nome: '', cargo: '', decreto: '' });
              setEditingIndex(null);
              setOpen(false);
            }}>{editingIndex !== null ? 'Salvar Edição' : 'Adicionar'}</Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
}

export default App;
