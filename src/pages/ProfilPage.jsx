import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Lock, Trash2, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { profilApi } from "../services/api";

export default function ProfilPage() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();

  const [nomUtilisateur, setNomUtilisateur] = useState(
    user?.nom_utilisateur || ""
  );
  const [email, setEmail] = useState(user?.email || "");
  const [ancienMdp, setAncienMdp] = useState("");
  const [nouveauMdp, setNouveauMdp] = useState("");

  const [profilMsg, setProfilMsg] = useState("");
  const [profilErr, setProfilErr] = useState("");
  const [mdpMsg, setMdpMsg] = useState("");
  const [mdpErr, setMdpErr] = useState("");
  const [savingProfil, setSavingProfil] = useState(false);
  const [savingMdp, setSavingMdp] = useState(false);

  const handleUpdateProfil = async (e) => {
    e.preventDefault();
    setSavingProfil(true);
    setProfilMsg("");
    setProfilErr("");

    try {
      const updated = await profilApi.update({
        nom_utilisateur: nomUtilisateur.trim() || null,
        email: email.trim(),
      });
      setUser(updated);
      setProfilMsg("Profil mis à jour avec succès.");
    } catch (err) {
      setProfilErr(err.message);
    } finally {
      setSavingProfil(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSavingMdp(true);
    setMdpMsg("");
    setMdpErr("");

    try {
      const res = await profilApi.changePassword({
        ancien_mot_de_passe: ancienMdp,
        nouveau_mot_de_passe: nouveauMdp,
      });
      setAncienMdp("");
      setNouveauMdp("");
      setMdpMsg(res?.message || "Mot de passe modifié avec succès.");
    } catch (err) {
      setMdpErr(err.message);
    } finally {
      setSavingMdp(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !window.confirm(
        "Attention : la suppression de votre compte effacera définitivement tous vos sites, catégories, favoris, notes et historiques. Confirmer ?"
      )
    ) {
      return;
    }
    try {
      await profilApi.deleteAccount();
      logout();
      navigate("/login");
    } catch (err) {
      setProfilErr(err.message);
    }
  };

  return (
    <div className="page-container narrow-container">
      <div className="page-header">
        <div>
          <h1>Mon profil</h1>
          <p className="page-subtitle">
            Gérez vos informations personnelles et la sécurité de votre compte.
          </p>
        </div>
      </div>

      {/* Informations générales */}
      <form onSubmit={handleUpdateProfil} className="card-form mb-20">
        <h3>
          <User size={18} style={{ verticalAlign: "middle", marginRight: 8 }} />
          Informations du compte
        </h3>

        {profilErr && <div className="alert alert-error">{profilErr}</div>}
        {profilMsg && <div className="alert alert-success">{profilMsg}</div>}

        <div className="form-group">
          <label htmlFor="profil_nom">Nom / Pseudo d'affichage</label>
          <input
            id="profil_nom"
            type="text"
            maxLength={100}
            value={nomUtilisateur}
            onChange={(e) => setNomUtilisateur(e.target.value)}
            placeholder="Votre nom ou pseudo"
          />
        </div>

        <div className="form-group">
          <label htmlFor="profil_email">Adresse email *</label>
          <input
            id="profil_email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={savingProfil}
          >
            <Save size={16} />
            <span>
              {savingProfil ? "Enregistrement..." : "Mettre à jour le profil"}
            </span>
          </button>
        </div>
      </form>

      {/* Sécurité & Mot de passe */}
      <form onSubmit={handleChangePassword} className="card-form mb-20">
        <h3>
          <Lock size={18} style={{ verticalAlign: "middle", marginRight: 8 }} />
          Modifier mon mot de passe
        </h3>

        {mdpErr && <div className="alert alert-error">{mdpErr}</div>}
        {mdpMsg && <div className="alert alert-success">{mdpMsg}</div>}

        <div className="form-group">
          <label htmlFor="ancien_mdp">Mot de passe actuel *</label>
          <input
            id="ancien_mdp"
            type="password"
            required
            value={ancienMdp}
            onChange={(e) => setAncienMdp(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="nouveau_mdp">
            Nouveau mot de passe * (8 caractères min.)
          </label>
          <input
            id="nouveau_mdp"
            type="password"
            required
            minLength={8}
            value={nouveauMdp}
            onChange={(e) => setNouveauMdp(e.target.value)}
          />
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={savingMdp}
          >
            <Lock size={16} />
            <span>
              {savingMdp ? "Modification..." : "Changer le mot de passe"}
            </span>
          </button>
        </div>
      </form>

      {/* Zone de danger */}
      <div className="card-form danger-zone">
        <h3>Zone de danger</h3>
        <p className="muted-text">
          La suppression de votre compte est irréversible et supprime toutes les
          données associées à votre espace personnel.
        </p>
        <button
          type="button"
          className="btn btn-danger"
          onClick={handleDeleteAccount}
        >
          <Trash2 size={16} />
          <span>Supprimer définitivement mon compte</span>
        </button>
      </div>
    </div>
  );
}
