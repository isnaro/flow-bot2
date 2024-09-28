if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
    return message.channel.send("You do not have permission to use this command.");
}
