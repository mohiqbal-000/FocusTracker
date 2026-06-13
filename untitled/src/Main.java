import javax.swing.*;
import java.awt.event.*;

class ComboAdd extends JFrame implements ActionListener
{
    JComboBox c1,c2;
    JButton b1;
    JTextField t1;

    ComboAdd()
    {
        Integer n[]={1,2,3,4,5};

        c1=new JComboBox(n);
        c1.setBounds(100,50,80,30);

        c2=new JComboBox(n);
        c2.setBounds(200,50,80,30);

        b1=new JButton("Add");
        b1.setBounds(140,100,100,30);

        t1=new JTextField();
        t1.setBounds(140,150,100,30);

        add(c1); add(c2);
        add(b1); add(t1);

        b1.addActionListener(this);

        setSize(400,300);
        setLayout(null);
        setVisible(true);
    }

    public void actionPerformed(ActionEvent e)
    {
        int a=(Integer)c1.getSelectedItem();
        int b=(Integer)c2.getSelectedItem();

        t1.setText(String.valueOf(a+b));
    }

    public static void main(String args[])
    {
        new ComboAdd();
    }
}