import json
import os
import pandas as pd
from datetime import datetime

path = '/content/drive/MyDrive/TrabalhoAprovado/Camilo/Resultados'
exp1 = os.path.join(path, 'result2.json')
exp2 = os.path.join(path, 'result_idepotency.json')

# esta função é que vai ler o json do relatório e transformar em um dataframe, para fazer as análises
def prepare_dataframe(data):
  df_list = []
  df_histogram_2xx = []
  df_histogram = []
  for i, it in enumerate(data["intermediate"]):
      # Converter o timestamp para datetime
      first_counter_at = datetime.utcfromtimestamp(it["firstCounterAt"] / 1000)
      last_counter_at = datetime.utcfromtimestamp(it["lastCounterAt"] / 1000)
      duration = (last_counter_at - first_counter_at).total_seconds()

      # Criar dicionário de dados para o DataFrame principal
      row_data = {"Timestamp": first_counter_at, "Duration (s)": duration}

      # Iterar sobre as métricas aninhadas, exceto "summaries" e "histogram"
      for key, value in it.items():
          if key not in ["summaries", "histograms", "firstCounterAt", "lastCounterAt"]:
              if isinstance(value, dict):
                  for sub_key, sub_value in value.items():
                      row_data[f"{key}.{sub_key}"] = sub_value
              else:
                  row_data[key] = value

      # Criar DataFrame para essa linha e adicionar à lista
      df_list.append(pd.DataFrame([row_data]).set_index("Timestamp"))

      # Processar "histogram" separadamente
      if it["histograms"]:
        response_time = it['histograms']['http.response_time']
        row = pd.DataFrame(response_time, index=[first_counter_at])
        row['duration'] = duration
        df_histogram.append(row)

        response_time_2xx = it['histograms']['http.response_time.2xx']
        row = pd.DataFrame(response_time_2xx, index=[first_counter_at])
        row['duration'] = duration
        df_histogram_2xx.append(row)
  return df_list, df_histogram, df_histogram_2xx

# lê o json do relatório
with open(exp1, "r") as file:
  data = json.load(file)

# transforma o json em dataframe
df_list, df_histogram, df_histogram_2xx = prepare_dataframe(data)
df_main1 = pd.concat(df_list)
df_histogram1 = pd.concat(df_histogram) if df_histogram else pd.DataFrame()

# repete a mesma coisa para o exp2, experimento 2
with open(exp2, "r") as file:
  data = json.load(file)

df_list, df_histogram, df_histogram_2xx = prepare_dataframe(data)
df_main2 = pd.concat(df_list)
df_histogram2 = pd.concat(df_histogram) if df_histogram else pd.DataFrame()

del df_list, df_histogram, df_histogram_2xx

# -----------------------------------------------------------------------------
# algumas métricas usadas para preencher a tabela de métricas
data['aggregate']['counters']

# organizando o index dos dataframes, fazendo o shift do horário para começar em 0
df_main1.index = df_main1.index.map(lambda x: pd.to_datetime(x))
df_main1['time'] = df_main1.index.time
df_main1["time"] = (df_main1.index - df_main1.index[0]).total_seconds()
df_main1["time"] = pd.to_datetime(df_main1["time"], unit="s").dt.time
df_main1 = df_main1.reset_index()
df_main1 = df_main1.set_index('time')

df_histogram1.index = df_histogram1.index.map(lambda x: pd.to_datetime(x))
df_histogram1['time'] = df_histogram1.index.time
df_histogram1["time"] = (df_histogram1.index - df_histogram1.index[0]).total_seconds()
df_histogram1["time"] = pd.to_datetime(df_histogram1["time"], unit="s").dt.time
df_histogram1 = df_histogram1.reset_index()
df_histogram1 = df_histogram1.set_index('time')
df_histogram1.index = df_main1.index[:df_histogram1.index.size]

df_main2.index = df_main2.index.map(lambda x: pd.to_datetime(x))
df_main2['time'] = df_main2.index.time
df_main2["time"] = (df_main2.index - df_main2.index[0]).total_seconds()
df_main2["time"] = pd.to_datetime(df_main2["time"], unit="s").dt.time
df_main2 = df_main2.reset_index()
df_main2 = df_main2.set_index('time')

df_histogram2.index = df_histogram2.index.map(lambda x: pd.to_datetime(x))
df_histogram2['time'] = df_histogram2.index.time
df_histogram2["time"] = (df_histogram2.index - df_histogram2.index[0]).total_seconds()
df_histogram2["time"] = pd.to_datetime(df_histogram2["time"], unit="s").dt.time
df_histogram2 = df_histogram2.reset_index()
df_histogram2 = df_histogram2.set_index('time')
df_histogram2.index = df_main2.index[:df_histogram2.index.size]

# -----------------------------------------------------------------------------------------------------------
# fazendo a média por bin dos principais indicadores
temp1 = df_main1.loc[
    :, ['counters.vusers.created', 'counters.vusers.failed', 'counters.vusers.completed', 'rates.http.request_rate', 'counters.http.requests',
        'counters.http.codes.200', 'counters.errors.ETIMEDOUT', 'counters.http.codes.429', 'counters.errors.ENOTFOUND', 'counters.errors.EMFILE', 'counters.errors.EADDRNOTAVAIL', 'Duration (s)']
].copy()
temp1 = temp1.fillna(0)
temp1['counters.http.requests'] = temp1['counters.http.requests'] / temp1.loc[:, 'Duration (s)']
temp1['counters.vusers.failed'] = temp1['counters.vusers.failed'] / temp1.loc[:, 'Duration (s)']

temp1['latency.avg'] = temp1['Duration (s)'] / temp1['counters.vusers.created'] * 1000
temp1['rate.vusers.completed'] = temp1['counters.vusers.completed'] / temp1['counters.vusers.created']

temp1['rate.success'] = temp1.loc[:, 'counters.http.codes.200'] / temp1.loc[:, ['counters.http.codes.429', 'counters.http.codes.200', 'counters.errors.ETIMEDOUT', 'counters.errors.ENOTFOUND', 'counters.errors.EMFILE', 'counters.errors.EADDRNOTAVAIL']].sum(axis=1)
temp1['rate.timedout'] = temp1.loc[:, 'counters.errors.ETIMEDOUT'] / temp1.loc[:, ['counters.http.codes.429', 'counters.http.codes.200', 'counters.errors.ETIMEDOUT', 'counters.errors.ENOTFOUND', 'counters.errors.EMFILE', 'counters.errors.EADDRNOTAVAIL']].sum(axis=1)
temp1['rate.errors'] = temp1.loc[:, ['counters.http.codes.429', 'counters.errors.ETIMEDOUT', 'counters.errors.ENOTFOUND', 'counters.errors.EMFILE', 'counters.errors.EADDRNOTAVAIL']].sum(axis=1) / temp1.loc[:, ['counters.http.codes.429', 'counters.http.codes.200', 'counters.errors.ETIMEDOUT', 'counters.errors.ENOTFOUND', 'counters.errors.EMFILE', 'counters.errors.EADDRNOTAVAIL']].sum(axis=1)

temp1['counters.http.codes.200'] = temp1['counters.http.codes.200'] / temp1.loc[:, 'Duration (s)']
temp1['counters.errors.ETIMEDOUT'] = temp1['counters.errors.ETIMEDOUT'] / temp1.loc[:, 'Duration (s)']
temp1 = temp1.fillna(0)

temp2 = df_main2.loc[
    :, ['counters.vusers.created', 'counters.vusers.failed', 'counters.vusers.completed', 'rates.http.request_rate', 'counters.http.requests',
        'counters.http.codes.200', 'counters.errors.ETIMEDOUT', 'counters.http.codes.429', 'counters.errors.ENOTFOUND', 'counters.errors.EMFILE', 'counters.errors.EADDRNOTAVAIL', 'Duration (s)']
].copy()
temp2 = temp2.fillna(0)
temp2['counters.http.requests'] = temp2['counters.http.requests'] / temp2.loc[:, 'Duration (s)']
temp2['counters.vusers.failed'] = temp2['counters.vusers.failed'] / temp2.loc[:, 'Duration (s)']

temp2['latency.avg'] = temp2['Duration (s)'] / temp2['counters.vusers.created'] * 1000
temp2['rate.vusers.completed'] = temp2['counters.vusers.completed'] / temp2['counters.vusers.created']

temp2['rate.success'] = temp2.loc[:, 'counters.http.codes.200'] / temp2.loc[:, ['counters.http.codes.429', 'counters.http.codes.200', 'counters.errors.ETIMEDOUT', 'counters.errors.ENOTFOUND', 'counters.errors.EMFILE', 'counters.errors.EADDRNOTAVAIL']].sum(axis=1)
temp2['rate.timedout'] = temp2.loc[:, 'counters.errors.ETIMEDOUT'] / temp2.loc[:, ['counters.http.codes.429', 'counters.http.codes.200', 'counters.errors.ETIMEDOUT', 'counters.errors.ENOTFOUND', 'counters.errors.EMFILE', 'counters.errors.EADDRNOTAVAIL']].sum(axis=1)
temp2['rate.errors'] = temp2.loc[:, ['counters.http.codes.429', 'counters.errors.ETIMEDOUT', 'counters.errors.ENOTFOUND', 'counters.errors.EMFILE', 'counters.errors.EADDRNOTAVAIL']].sum(axis=1) / temp2.loc[:, ['counters.http.codes.429', 'counters.http.codes.200', 'counters.errors.ETIMEDOUT', 'counters.errors.ENOTFOUND', 'counters.errors.EMFILE', 'counters.errors.EADDRNOTAVAIL']].sum(axis=1)

temp2['counters.http.codes.200'] = temp2['counters.http.codes.200'] / temp2.loc[:, 'Duration (s)']
temp2['counters.errors.ETIMEDOUT'] = temp2['counters.errors.ETIMEDOUT'] / temp2.loc[:, 'Duration (s)']
temp2 = temp2.fillna(0)

# -------------------------------------------------------------------------------
# esta seção captura  os três trechos críticos citados no trabalho
# um na rampa, em idx_rampa, e dois em idx_all, depois da rampa
def encontrar_trechos_crescentes(t, minimo=3):
    """
    Encontra trechos consecutivos de crescimento na série t
    com pelo menos `minimo` pares com média acima do percentil 75 da série.
    """
    trechos = []
    inicio = None
    cont = 0  # número de pares consecutivos em crescimento
    limiar = t.quantile(0.75)

    for i in range(len(t) - 1):
        media_par = (t.iloc[i] + t.iloc[i+1]) / 2
        if media_par > limiar:
            #print(media_par, limiar)
            if inicio is None:
                inicio = i
            cont += 1
        else:
            if cont >= minimo:
                trechos.append((inicio, i))
            inicio = None
            cont = 0

    # Caso o trecho continue até o final da série
    if inicio is not None and cont >= minimo:
        trechos.append((inicio, len(t) - 1))

    return trechos

# pegar o início e fim de cada intervalo crítico
# a posição 65 é o final da rampa. 
increasing_sequences = encontrar_trechos_crescentes(temp2.loc[temp2.index[0:65], 'counters.http.requests'], minimo=12)
idx_rampa = [temp2.index[0:65][it[0]-2:it[1]+1+12] for it in increasing_sequences]
print(increasing_sequences, [temp2.index[0:65][it[0]:it[1]+1] for it in increasing_sequences])
# e aqui a partir do final da rampa. 
increasing_sequences = encontrar_trechos_crescentes(temp2.loc[temp2.index[65:], 'counters.http.requests'], minimo=12)
idx_all = [temp2.index[65:][it[0]-2:it[1]+1+12] for it in increasing_sequences]
print(increasing_sequences, [temp2.index[65:][it[0]:it[1]+1] for it in increasing_sequences])

# ---------------------------------------------------------------------------------------------------
# este código cria uma tabela com as métricas de cada um dos intervalos, é só mudar o idx_rampa e idx_all, assim como temp1 (experimento 1) e temp2 (experimento2)
pd.concat([
    temp2.loc[idx_all[1], ['counters.http.requests', 'rate.success', 'rate.timedout', 'rate.errors']],
    df_histogram2.loc[idx_all[1], ['max']]
], axis=1).apply(lambda x: x.astype(str).str.replace('.', ',')).reset_index()


# este trecho é o que exporta a média móvel de 6 bins das requisições, gerando a tabela que foi copiada para a planilha e deu origem ao gráfico de RPS e latência.
window_size = 6  # Define the window size for the moving average, aproximadamente 60 segundos
moving_average = temp2['counters.http.requests'].rolling(window=window_size, min_periods=1).mean()
moving_average.plot(logy=True);
print(moving_average.shape)
moving_average.astype(str).str.replace('.', ',').to_frame()

# da mesma forma, o codigo a seguir faz a mesma coisa, mas para a latência, é copiar e colar na planilha, para construir o gráfico.
window_size = 6
moving_average = df_histogram2.p999.rolling(window=window_size, min_periods=1).mean()
moving_average.plot(logy=True);
print(moving_average.shape)
moving_average.astype(str).str.replace('.', ',').to_frame()
