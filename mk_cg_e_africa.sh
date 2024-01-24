sed 's/REGION/eastern Africa/' snip_cg_template.html | sed 's/ZOOM/6.0/' | sed 's/WIDTH/850/' | sed 's/HEIGHT/790/' | \
  sed 's/CENTER/3.8,42.3/' | sed 's/STAT/data/'| sed 's/ACCUM/5-day/' | sed 's/LEGEND/precip_monthly_data_raster.png/' | \
  sed 's/F_PERIOD/05day/' > e_africa/snip_cg_05day_data_e_afr.html

sed 's/REGION/eastern Africa/' snip_cg_template.html | sed 's/ZOOM/6.0/' | sed 's/WIDTH/850/' | sed 's/HEIGHT/790/' | \
  sed 's/CENTER/3.8,42.3/' | sed 's/STAT/anomaly/'| sed 's/ACCUM/5-day/' | sed 's/LEGEND/precip_monthly_anom_raster.png/' | \
  sed 's/F_PERIOD/05day/' > e_africa/snip_cg_05day_anom_e_afr.html

sed 's/REGION/eastern Africa/' snip_cg_template.html | sed 's/ZOOM/6.0/' | sed 's/WIDTH/850/' | sed 's/HEIGHT/790/' | \
  sed 's/CENTER/3.8, 42.3/' | sed 's/STAT/zscore/'| sed 's/ACCUM/5-day/' | sed 's/LEGEND/precip_zscore_raster.png/' | \
  sed 's/F_PERIOD/05day/' > e_africa/snip_cg_05day_zscore_e_afr.html



sed 's/REGION/eastern Africa/' snip_cg_template.html | sed 's/ZOOM/6.0/' | sed 's/WIDTH/850/' | sed 's/HEIGHT/790/' | \
  sed 's/CENTER/3.8,42.3/' | sed 's/STAT/data/'| sed 's/ACCUM/10-day/' | sed 's/LEGEND/precip_monthly_data_raster.png/' | \
  sed 's/F_PERIOD/10day/' > e_africa/snip_cg_10day_data_e_afr.html

sed 's/REGION/eastern Africa/' snip_cg_template.html | sed 's/ZOOM/6.0/' | sed 's/WIDTH/850/' | sed 's/HEIGHT/790/' | \
  sed 's/CENTER/3.8,42.3/' | sed 's/STAT/anomaly/'| sed 's/ACCUM/10-day/' | sed 's/LEGEND/precip_monthly_anom_raster.png/' | \
  sed 's/F_PERIOD/10day/' > e_africa/snip_cg_10day_anom_e_afr.html

sed 's/REGION/eastern Africa/' snip_cg_template.html | sed 's/ZOOM/6.0/' | sed 's/WIDTH/850/' | sed 's/HEIGHT/790/' | \
  sed 's/CENTER/3.8, 42.3/' | sed 's/STAT/zscore/'| sed 's/ACCUM/10-day/' | sed 's/LEGEND/precip_zscore_raster.png/' | \
  sed 's/F_PERIOD/10day/' > e_africa/snip_cg_10day_zscore_e_afr.html




sed 's/REGION/eastern Africa/' snip_cg_template.html | sed 's/ZOOM/6.0/' | sed 's/WIDTH/850/' | sed 's/HEIGHT/790/' | \
  sed 's/CENTER/3.8,42.3/' | sed 's/STAT/data/'| sed 's/ACCUM/15-day/' | sed 's/LEGEND/precip_monthly_data_raster.png/' | \
  sed 's/F_PERIOD/15day/' > e_africa/snip_cg_15day_data_e_afr.html

sed 's/REGION/eastern Africa/' snip_cg_template.html | sed 's/ZOOM/6.0/' | sed 's/WIDTH/850/' | sed 's/HEIGHT/790/' | \
  sed 's/CENTER/3.8,42.3/' | sed 's/STAT/anomaly/'| sed 's/ACCUM/15-day/' | sed 's/LEGEND/precip_monthly_anom_raster.png/' | \
  sed 's/F_PERIOD/15day/' > e_africa/snip_cg_15day_anom_e_afr.html

sed 's/REGION/eastern Africa/' snip_cg_template.html | sed 's/ZOOM/6.0/' | sed 's/WIDTH/850/' | sed 's/HEIGHT/790/' | \
  sed 's/CENTER/3.8, 42.3/' | sed 's/STAT/zscore/'| sed 's/ACCUM/15-day/' | sed 's/LEGEND/precip_zscore_raster.png/' | \
  sed 's/F_PERIOD/15day/' > e_africa/snip_cg_15day_zscore_e_afr.html
