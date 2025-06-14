-- Create helper functions for appointment management
CREATE OR REPLACE FUNCTION public.increment_participants(appointment_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.appointments
    SET current_participants = current_participants + 1,
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = appointment_id
    AND current_participants < max_participants
    AND NOT is_cancelled;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Could not increment participants. The appointment might be full, cancelled, or does not exist.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrement_participants(appointment_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.appointments
    SET current_participants = current_participants - 1,
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = appointment_id
    AND current_participants > 0
    AND NOT is_cancelled;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Could not decrement participants. The appointment might have no participants, be cancelled, or does not exist.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.join_appointment(p_appointment_id UUID, p_user_id UUID)
RETURNS void AS $$
BEGIN
    -- Check if the user is already participating
    IF EXISTS (
        SELECT 1 FROM public.appointments_participants
        WHERE appointment_id = p_appointment_id AND user_id = p_user_id
    ) THEN
        RAISE EXCEPTION 'User is already participating in this appointment.';
    END IF;

    -- Insert the participation record
    INSERT INTO public.appointments_participants (appointment_id, user_id)
    VALUES (p_appointment_id, p_user_id);

    -- Increment the participants count
    PERFORM public.increment_participants(p_appointment_id);
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to join appointment: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.leave_appointment(p_appointment_id UUID, p_user_id UUID)
RETURNS void AS $$
BEGIN
    -- Check if the user is actually participating
    IF NOT EXISTS (
        SELECT 1 FROM public.appointments_participants
        WHERE appointment_id = p_appointment_id AND user_id = p_user_id
    ) THEN
        RAISE EXCEPTION 'User is not participating in this appointment.';
    END IF;

    -- Delete the participation record
    DELETE FROM public.appointments_participants
    WHERE appointment_id = p_appointment_id AND user_id = p_user_id;

    -- Decrement the participants count
    PERFORM public.decrement_participants(p_appointment_id);
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to leave appointment: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
