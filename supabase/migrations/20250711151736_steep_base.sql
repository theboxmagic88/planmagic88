@@ .. @@
-- Audit logs policies
CREATE POLICY "Users can view their own audit logs" ON audit_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR auth.jwt() ->> 'role' = 'Admin');

+CREATE POLICY "Enable audit log inserts for authenticated users" ON audit_logs
+  FOR INSERT TO authenticated
+  WITH CHECK (true);
+
+CREATE POLICY "Enable audit log inserts for system" ON audit_logs
+  FOR INSERT TO anon
+  WITH CHECK (true);