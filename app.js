(() => {
  const el = (id) => document.getElementById(id);
  const NEUTRAL = 87.0;

  function fmt(x, d=1){
    if (!isFinite(x)) return "—";
    return Number(x).toFixed(d);
  }

  function showError(msg){
    const box = el("errors");
    box.style.display = "block";
    box.textContent = msg;
  }
  function clearError(){
    const box = el("errors");
    box.style.display = "none";
    box.textContent = "";
  }

  function setDecision(main, bullets){
    el("mainDecision").textContent = main;
    el("why").innerHTML = bullets.map(x => `• ${escapeHtml(x)}`).join("<br/>");
  }

  function escapeHtml(str){
    return String(str)
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function compute(){
    clearError();

    const mpta = parseFloat(el("mpta").value);
    const ldfa = parseFloat(el("ldfa").value);
    const jlca = parseFloat(el("jlca").value);

    if (![mpta, ldfa, jlca].every(v => isFinite(v))){
      showError("Veuillez saisir MPTA, LDFA et JLCA (valeurs numériques).");
      return;
    }
    if (jlca < 0){
      showError("JLCA ne peut pas être négatif dans ce calcul.");
      return;
    }

    const IAD = jlca;
    const EAD = ldfa - mpta;
    const GD  = IAD + EAD;

    if (GD <= 0){
      showError("Attention : GD ≤ 0 (IAD + EAD). Vérifiez la cohérence des mesures.");
    }

    const IADpct = (GD !== 0) ? (IAD / GD) * 100 : NaN;
    const EADpct = (GD !== 0) ? (EAD / GD) * 100 : NaN;

    let FDpct = NaN, TDpct = NaN;
    if (EAD !== 0){
      FDpct = ((ldfa - NEUTRAL) / EAD) * 100;
      TDpct = ((NEUTRAL - mpta) / EAD) * 100;
    }

    el("iad").textContent  = fmt(IAD, 1);
    el("ead").textContent  = fmt(EAD, 1);
    el("gd").textContent   = fmt(GD, 1);
    el("iadp").textContent = fmt(IADpct, 0) + " %";
    el("eadp").textContent = fmt(EADpct, 0) + " %";

    if (isFinite(FDpct) && isFinite(TDpct)){
      el("bony").textContent = `FD% ${fmt(FDpct,0)} % / TD% ${fmt(TDpct,0)} %`;
    } else {
      el("bony").textContent = "Non calculable (EAD = 0)";
    }

    // Décision
    let decision = "—";
    let rationale = [];

    if (Math.abs(EAD) < 0.1 && IAD > 0){
      decision = "PUC (UKA) probable";
      rationale.push("EAD ~ 0 : composante extra-articulaire négligeable, déformation plutôt intra-articulaire (JLCA).");
      rationale.push("À confronter au statut ligamentaire et à la topographie cartilagineuse.");
      return setDecision(decision, rationale);
    }

    if (isFinite(IADpct) && isFinite(EADpct) && IADpct <= 60 && EADpct <= 60){
      decision = "Zone grise : PUC vs Ostéotomie (discussion)";
      rationale.push("IAD% ≤ 60% et EAD% ≤ 60% : décision partagée selon âge, sport, ménisque/cartilage, laxité, attentes.");
      return setDecision(decision, rationale);
    }

    if (isFinite(IADpct) && IADpct > 60){
      decision = "PUC (UKA) plutôt indiquée";
      rationale.push(`IAD% > 60% (${fmt(IADpct,0)}%) : déformation majoritairement intra-articulaire (JLCA).`);
      rationale.push("Objectif : correction vers le neutre sans compromettre la PUC.");
      return setDecision(decision, rationale);
    }

    if (isFinite(EADpct) && EADpct > 60){
      rationale.push(`EAD% > 60% (${fmt(EADpct,0)}%) : déformation majoritairement extra-articulaire.`);
      if (!isFinite(FDpct) || !isFinite(TDpct)){
        decision = "Ostéotomie (type à préciser)";
        rationale.push("Répartition fémur/tibia non calculable.");
        return setDecision(decision, rationale);
      }

      if (TDpct >= 80){
        decision = "Ostéotomie tibiale (HTO) – simple";
        rationale.push(`TD% ≥ 80% (${fmt(TDpct,0)}%) : composante tibiale prédominante.`);
      } else if (FDpct >= 80){
        decision = "Ostéotomie fémorale (DFO) – simple";
        rationale.push(`FD% ≥ 80% (${fmt(FDpct,0)}%) : composante fémorale prédominante.`);
      } else {
        decision = "Double-level osteotomy (DLO) – tibia + fémur";
        rationale.push(`Répartition partagée (FD% ${fmt(FDpct,0)}% / TD% ${fmt(TDpct,0)}%).`);
        rationale.push("Principe : répartir la correction pour éviter des angles extrêmes en mono-site.");
      }
      return setDecision(decision, rationale);
    }

    decision = "Résultat non concluant (vérifier les entrées)";
    rationale.push("Les pourcentages ne permettent pas une décision robuste.");
    return setDecision(decision, rationale);
  }

  el("compute").addEventListener("click", compute);

  el("demo").addEventListener("click", () => {
    el("mpta").value = "84.0";
    el("ldfa").value = "90.0";
    el("jlca").value = "4.0";
    compute();
  });

  el("reset").addEventListener("click", () => {
    el("mpta").value = "";
    el("ldfa").value = "";
    el("jlca").value = "";
    clearError();
    el("mainDecision").textContent = "—";
    el("why").textContent = "Renseigne les valeurs puis “Calculer”.";
    ["iad","ead","gd","iadp","eadp","bony"].forEach(id => el(id).textContent = "—");
  });
})();
