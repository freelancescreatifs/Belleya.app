/*
  # Améliorer la création automatique des tâches de production

  1. Améliorations
    - Calcul automatique de la priorité selon l'urgence (échéance vs maintenant)
    - Gestion d'erreur robuste pour ne pas bloquer la sauvegarde du contenu
    - Tous les champs requis sont systématiquement renseignés
    - Heure par défaut si non renseignée

  2. Logique de priorité automatique
    - Si échéance ≤ 24h → priority = 'high'
    - Si échéance ≤ 72h → priority = 'high'
    - Si échéance ≤ 7 jours → priority = 'medium'
    - Sinon → priority = 'low'

  3. Champs garantis
    - status = 'todo'
    - tags = 'Réseaux sociaux'
    - category = 'content'
    - priority = calculé automatiquement
    - due_time = '09:00' si non renseigné
*/

-- Fonction pour calculer la priorité selon l'échéance
CREATE OR REPLACE FUNCTION calculate_task_priority(p_due_date date)
RETURNS text AS $$
DECLARE
  v_days_until_due integer;
BEGIN
  -- Calculer le nombre de jours entre maintenant et l'échéance
  v_days_until_due := p_due_date - CURRENT_DATE;
  
  -- Déterminer la priorité selon l'urgence
  IF v_days_until_due <= 1 THEN
    RETURN 'high';
  ELSIF v_days_until_due <= 3 THEN
    RETURN 'high';
  ELSIF v_days_until_due <= 7 THEN
    RETURN 'medium';
  ELSE
    RETURN 'low';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fonction améliorée pour synchroniser les tâches de production
CREATE OR REPLACE FUNCTION sync_production_tasks()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid;
  v_company_id uuid;
  v_task_id uuid;
  v_existing_task_id uuid;
  v_step_name text;
  v_step_label text;
  v_step_date date;
  v_step_time text;
  v_priority text;
  v_social_media_tag text := 'Réseaux sociaux';
BEGIN
  -- Récupérer l'user_id et company_id du contenu
  v_user_id := NEW.user_id;
  v_company_id := NEW.company_id;

  -- Traiter chaque étape de production avec gestion d'erreur
  
  -- Écriture (Script)
  BEGIN
    v_step_name := 'script';
    v_step_label := 'Écriture - ' || NEW.title;
    v_step_date := NEW.date_script;
    v_step_time := COALESCE(NEW.date_script_time, '09:00');
    
    IF v_step_date IS NOT NULL THEN
      v_priority := calculate_task_priority(v_step_date);
      
      SELECT task_id INTO v_existing_task_id
      FROM production_tasks
      WHERE content_id = NEW.id AND production_step = v_step_name;

      IF v_existing_task_id IS NOT NULL THEN
        UPDATE tasks SET
          title = v_step_label,
          due_date = v_step_date,
          due_time = v_step_time,
          tags = v_social_media_tag,
          priority = v_priority,
          updated_at = now()
        WHERE id = v_existing_task_id;
      ELSE
        INSERT INTO tasks (user_id, company_id, title, description, due_date, due_time, tags, status, category, priority)
        VALUES (v_user_id, v_company_id, v_step_label, 'Tâche générée automatiquement pour le contenu: ' || NEW.title, v_step_date, v_step_time, v_social_media_tag, 'todo', 'content', v_priority)
        RETURNING id INTO v_task_id;
        
        INSERT INTO production_tasks (content_id, task_id, production_step)
        VALUES (NEW.id, v_task_id, v_step_name);
      END IF;
    ELSE
      DELETE FROM production_tasks WHERE content_id = NEW.id AND production_step = v_step_name;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Erreur création tâche Écriture pour contenu %: %', NEW.id, SQLERRM;
  END;

  -- Tournage (Shooting)
  BEGIN
    v_step_name := 'shooting';
    v_step_label := 'Tournage - ' || NEW.title;
    v_step_date := NEW.date_shooting;
    v_step_time := COALESCE(NEW.date_shooting_time, '09:00');
    
    IF v_step_date IS NOT NULL THEN
      v_priority := calculate_task_priority(v_step_date);
      
      SELECT task_id INTO v_existing_task_id
      FROM production_tasks
      WHERE content_id = NEW.id AND production_step = v_step_name;

      IF v_existing_task_id IS NOT NULL THEN
        UPDATE tasks SET
          title = v_step_label,
          due_date = v_step_date,
          due_time = v_step_time,
          tags = v_social_media_tag,
          priority = v_priority,
          updated_at = now()
        WHERE id = v_existing_task_id;
      ELSE
        INSERT INTO tasks (user_id, company_id, title, description, due_date, due_time, tags, status, category, priority)
        VALUES (v_user_id, v_company_id, v_step_label, 'Tâche générée automatiquement pour le contenu: ' || NEW.title, v_step_date, v_step_time, v_social_media_tag, 'todo', 'content', v_priority)
        RETURNING id INTO v_task_id;
        
        INSERT INTO production_tasks (content_id, task_id, production_step)
        VALUES (NEW.id, v_task_id, v_step_name);
      END IF;
    ELSE
      DELETE FROM production_tasks WHERE content_id = NEW.id AND production_step = v_step_name;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Erreur création tâche Tournage pour contenu %: %', NEW.id, SQLERRM;
  END;

  -- Montage (Editing)
  BEGIN
    v_step_name := 'editing';
    v_step_label := 'Montage - ' || NEW.title;
    v_step_date := NEW.date_editing;
    v_step_time := COALESCE(NEW.date_editing_time, '09:00');
    
    IF v_step_date IS NOT NULL THEN
      v_priority := calculate_task_priority(v_step_date);
      
      SELECT task_id INTO v_existing_task_id
      FROM production_tasks
      WHERE content_id = NEW.id AND production_step = v_step_name;

      IF v_existing_task_id IS NOT NULL THEN
        UPDATE tasks SET
          title = v_step_label,
          due_date = v_step_date,
          due_time = v_step_time,
          tags = v_social_media_tag,
          priority = v_priority,
          updated_at = now()
        WHERE id = v_existing_task_id;
      ELSE
        INSERT INTO tasks (user_id, company_id, title, description, due_date, due_time, tags, status, category, priority)
        VALUES (v_user_id, v_company_id, v_step_label, 'Tâche générée automatiquement pour le contenu: ' || NEW.title, v_step_date, v_step_time, v_social_media_tag, 'todo', 'content', v_priority)
        RETURNING id INTO v_task_id;
        
        INSERT INTO production_tasks (content_id, task_id, production_step)
        VALUES (NEW.id, v_task_id, v_step_name);
      END IF;
    ELSE
      DELETE FROM production_tasks WHERE content_id = NEW.id AND production_step = v_step_name;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Erreur création tâche Montage pour contenu %: %', NEW.id, SQLERRM;
  END;

  -- Sous-titres (Subtitles)
  BEGIN
    v_step_name := 'subtitles';
    v_step_label := 'Sous-titres - ' || NEW.title;
    v_step_date := NEW.date_subtitles;
    v_step_time := COALESCE(NEW.date_subtitles_time, '09:00');
    
    IF v_step_date IS NOT NULL THEN
      v_priority := calculate_task_priority(v_step_date);
      
      SELECT task_id INTO v_existing_task_id
      FROM production_tasks
      WHERE content_id = NEW.id AND production_step = v_step_name;

      IF v_existing_task_id IS NOT NULL THEN
        UPDATE tasks SET
          title = v_step_label,
          due_date = v_step_date,
          due_time = v_step_time,
          tags = v_social_media_tag,
          priority = v_priority,
          updated_at = now()
        WHERE id = v_existing_task_id;
      ELSE
        INSERT INTO tasks (user_id, company_id, title, description, due_date, due_time, tags, status, category, priority)
        VALUES (v_user_id, v_company_id, v_step_label, 'Tâche générée automatiquement pour le contenu: ' || NEW.title, v_step_date, v_step_time, v_social_media_tag, 'todo', 'content', v_priority)
        RETURNING id INTO v_task_id;
        
        INSERT INTO production_tasks (content_id, task_id, production_step)
        VALUES (NEW.id, v_task_id, v_step_name);
      END IF;
    ELSE
      DELETE FROM production_tasks WHERE content_id = NEW.id AND production_step = v_step_name;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Erreur création tâche Sous-titres pour contenu %: %', NEW.id, SQLERRM;
  END;

  -- Programmation (Scheduling)
  BEGIN
    v_step_name := 'scheduling';
    v_step_label := 'Programmation - ' || NEW.title;
    v_step_date := NEW.date_scheduling;
    v_step_time := COALESCE(NEW.date_scheduling_time, '09:00');
    
    IF v_step_date IS NOT NULL THEN
      v_priority := calculate_task_priority(v_step_date);
      
      SELECT task_id INTO v_existing_task_id
      FROM production_tasks
      WHERE content_id = NEW.id AND production_step = v_step_name;

      IF v_existing_task_id IS NOT NULL THEN
        UPDATE tasks SET
          title = v_step_label,
          due_date = v_step_date,
          due_time = v_step_time,
          tags = v_social_media_tag,
          priority = v_priority,
          updated_at = now()
        WHERE id = v_existing_task_id;
      ELSE
        INSERT INTO tasks (user_id, company_id, title, description, due_date, due_time, tags, status, category, priority)
        VALUES (v_user_id, v_company_id, v_step_label, 'Tâche générée automatiquement pour le contenu: ' || NEW.title, v_step_date, v_step_time, v_social_media_tag, 'todo', 'content', v_priority)
        RETURNING id INTO v_task_id;
        
        INSERT INTO production_tasks (content_id, task_id, production_step)
        VALUES (NEW.id, v_task_id, v_step_name);
      END IF;
    ELSE
      DELETE FROM production_tasks WHERE content_id = NEW.id AND production_step = v_step_name;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Erreur création tâche Programmation pour contenu %: %', NEW.id, SQLERRM;
  END;

  -- Déterminer automatiquement le statut du contenu
  NEW.status := determine_content_status(
    NEW.date_script,
    NEW.date_shooting,
    NEW.date_editing,
    NEW.date_subtitles,
    NEW.date_validation,
    NEW.date_scheduling,
    NEW.publication_date
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
